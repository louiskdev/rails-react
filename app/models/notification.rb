class Notification < ActiveRecord::Base

  belongs_to :user
  belongs_to :initiator, polymorphic: true
  belongs_to :object, polymorphic: true

  validates :name, presence: true
  validates :user_id, presence: true

  after_create :remove_similar_old_notifications
  after_create :notify_user_now

  scope :unread, -> { where(read_at: nil) }

  def code
    case self.name
      when 'invitation:accepted', 'invitation:declined' then 0
      when 'invitation:new_member' then 1

      when 'friendships:create' then 1
      when 'friendships:approve' then 0
      when 'friendships:decline' then 0
      when 'friendships:destroy' then 0

      when 'medium:liked' then 10
      when 'medium:rated' then 10
      when 'medium:commented' then 10

      when 'post:liked' then 10
      when 'post:rated' then 10
      when 'post:commented' then 10

      when 'note:liked' then 10
      when 'note:rated' then 10
      when 'note:commented' then 10

      when 'comment:liked' then 10
      when 'comments:reply' then 11

      when 'bubbles.join_user' then 12
      when 'bubbles.disjoin_user' then 12

      when 'bubbles.ban_user' then 13
      when 'bubbles.unban_user' then 13

      when 'users.mention' then 14
    end
  end

  def user_friendly_name
    case self.name
      when 'medium:liked' then "liked your #{medium_type}"
      when 'medium:rated' then "Your #{medium_type} was rated"
      when 'medium:commented' then "Your #{medium_type} was commented"

      when 'post:liked' then 'liked your post'
      when 'post:rated' then 'rated your post'
      when 'post:commented' then 'commented your post'

      when 'note:liked' then 'liked a note on your feed'
      when 'note:rated' then 'rated a note on your feed'
      when 'note:commented' then 'commented a note on your feed'

      when 'comment:liked' then 'liked your comment'
      when 'comments:reply' then 'replied to your comment'

      when 'events.create' then 'created the event'

      when 'album:liked' then 'Your album was liked'
      when 'album:commented' then 'Your album was commented'

      when 'bubble:liked' then 'Your bubble was liked'
      when 'bubbles.join_user' then 'has joined the bubble'
      when 'bubbles.disjoin_user' then 'left your bubble'
      when 'bubbles.ban_user' then 'has been banned from bubble'
      when 'bubble.unban_user' then 'has been unbanned from bubble'

      when 'friendships:create' then 'wants to add you as a friend'
      when 'friendships:approve' then 'was added to your Friends list'
      when 'friendships:decline' then 'declined your friendship request'
      when 'friendships:destroy' then 'was removed from your Friends list'

      when 'invitation:new_member' then 'You were invited to join the bubble'
      when 'invitation:accepted' then 'accepted your invitation to join bubble'
      when 'invitation:declined' then 'declined your invitation to join bubble'

      when 'users.mention' then 'has mentioned you'
      else
        nil
    end
  end

  def to_hash
    hash = {}
    hash[:id] = self.id
    hash[:text] = self.user_friendly_name
    hash[:created_at] = self.created_at.iso8601
    hash[:code] = self.code
    hash[:name] = self.name
    if self.initiator.present?
      initiator = self.initiator
      hash[:initiator] = {}
      hash[:initiator][:model] = 'User'
      hash[:initiator][:id] = initiator.id
      hash[:initiator][:name] = initiator.first_name
      hash[:initiator][:url] = initiator.username
      hash[:initiator][:avatar_url] = initiator.avatar_url(:micro)
    end
    self.extra_data.each do |key, value|
      hash[key.to_sym] = value
      case key
        when 'bubble_id'
          bubble = Bubble.find_by(id: value.to_i)
          if bubble.nil?
            hash[:place] = ''
          else
            hash[:place] = {}
            hash[:place][:tab] = 'bubble_root'
            hash[:place][:name] = bubble.name
            hash[:place][:link] = bubble.permalink
          end
        when 'media_id'
          media = Medium.find_by(id: value.to_i)
          if media.nil?
            hash[:media_title] = ''
            hash[:media_thumb_url] = ''
            hash[:place] = ''
          else
            hash[:media_title] = media.title
            hash[:media_thumb_url] = media.thumb_url
            if media.mediable.nil?
              user = media.uploader
              if user.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'user_gallery'
                hash[:place][:name] = user.first_name
                hash[:place][:link] = user.username
              end
            elsif media.mediable_type == 'Widgets::GalleryWidget::Gallery'
              bubble = media.mediable.bubble rescue nil
              if bubble.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'bubble_gallery'
                hash[:place][:name] = bubble.name
                hash[:place][:link] = bubble.permalink
              end
            elsif media.mediable_type == 'Widgets::BlogWidget::Post'
              bubble = media.mediable.blog.bubble rescue nil
              hash[:blog_id] = media.mediable.blog.id rescue ''
              if bubble.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'bubble_blog'
                hash[:place][:name] = bubble.name
                hash[:place][:link] = bubble.permalink
              end
            elsif media.mediable_type == 'Note'
              user = media.uploader
              if user.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'user_notes'
                hash[:place][:name] = user.first_name
                hash[:place][:link] = user.username
              end
            end
          end
        when 'note_id'
          note = Note.find_by(id: value.to_i)
          if note.nil?
            hash[:place] = ''
            hash[:note_text] = ''
          else
            hash[:note_text] = note.text.present? ? note.text.truncate(100) : ''
            user = note.user
            if user.nil?
              hash[:place] = ''
            else
              hash[:place] = {}
              hash[:place][:tab] = 'user_notes'
              hash[:place][:name] = user.first_name
              hash[:place][:link] = user.username
            end
          end
        when 'post_id'
          post = Widgets::BlogWidget::Post.find_by(id: value.to_i)
          if post.nil?
            hash[:place] = ''
            hash[:post_text] = ''
          else
            hash[:post_text] = post.text.present? ? post.text.truncate(100) : ''
            hash[:blog_id] = post.blog.id rescue ''
            bubble = post.blog.bubble rescue nil
            if bubble.nil?
              hash[:place] = ''
            else
              hash[:place] = {}
              hash[:place][:tab] = 'bubble_blog'
              hash[:place][:name] = bubble.name
              hash[:place][:link] = bubble.permalink
            end
          end
        when 'comment_id'
          comment = Comment.find_by(id: value.to_i)
          if comment.nil?
            hash[:comment_text] = ''
            hash[:place] = ''
          else
            hash[:comment_text] = comment.body.present? ? comment.body.truncate(100) : ''
            if comment.commentable_type == 'Widgets::GalleryWidget::Gallery'
              bubble = comment.commentable.bubble rescue nil
              if bubble.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'bubble_gallery'
                hash[:place][:name] = bubble.name
                hash[:place][:link] = bubble.permalink
              end
            elsif comment.commentable_type == 'Widgets::BlogWidget::Post'
              bubble = comment.commentable.blog.bubble rescue nil
              hash[:blog_id] = comment.commentable.blog.id rescue ''
              if bubble.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'bubble_blog'
                hash[:place][:name] = bubble.name
                hash[:place][:link] = bubble.permalink
              end
            elsif comment.commentable_type == 'Note'
              user = comment.commentable.user rescue nil
              if user.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'user_notes'
                hash[:place][:name] = user.first_name
                hash[:place][:link] = user.username
              end
            elsif comment.commentable_type == 'Medium'
              user = comment.commentable.uploader rescue nil
              if user.nil?
                hash[:place] = ''
              else
                hash[:place] = {}
                hash[:place][:tab] = 'user_gallery'
                hash[:place][:name] = user.first_name
                hash[:place][:link] = user.username
              end
            end
          end
      end
    end unless self.extra_data.blank?

    hash
  end

  private

  def medium_type
    case self.object_type
      when 'Medium' then self.object.type
      when 'Comment' then self.object.commentable.type
      when 'Activity' then self.object.object.type
      else
        raise 'Exception'
    end
  rescue
    'file'
  end

  def remove_similar_old_notifications
    if self.name =~ /\Afriendships:/
      similar_old_notification_ids = Notification.where.not(id: self.id).
          where(user_id: self.user_id, initiator_type: self.initiator_type, initiator_id: self.initiator_id, name: self.name).ids
      unless similar_old_notification_ids.blank?
        # real-time notification
        # Pusher.trigger("private-user-#{self.user_id}", 'notifications_removed', removed_notifications: {ids: similar_old_notification_ids})
        ws_msg = {
            adapter: 'pusher',
            channel: "private-user-#{self.user_id}",
            event: 'notifications_removed',
            data: {
                removed_notifications: {
                    ids: similar_old_notification_ids
                }
            },
            debug_info: {
                location: 'Notification#remove_similar_old_notifications',
                notification_ids: similar_old_notification_ids,
                user_id: self.user_id,
            }
        }
        RealTimeNotificationJob.perform_later(ws_msg)

        Notification.destroy_all(id: similar_old_notification_ids)
      end
    end
  end

  def notify_user_now
    if [0, 1, 10, 11, 12, 13, 14].include? self.code

      # real-time notification
      # Pusher.trigger("private-user-#{self.user_id}", 'notification_added', notification: self.to_hash)
      ws_msg = {
          adapter: 'pusher',
          channel: "private-user-#{self.user_id}",
          event: 'notification_added',
          data: {
              notification: self.to_hash
          },
          debug_info: {
              location: 'Notification#notify_user_now',
              notification_id: self.id,
              user_id: self.user_id,
          }
      }
      RealTimeNotificationJob.perform_later(ws_msg)
    end
  end

end
