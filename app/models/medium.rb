class Medium < ActiveRecord::Base
  include RatingProcessing
  ITEMS_PER_PAGE = 36

  acts_as_likeable
  acts_as_commentable

  belongs_to :uploader, class_name: "User", foreign_key: :user_id
  belongs_to :album
  belongs_to :attachmentable, polymorphic: true, dependent: :destroy
  belongs_to :mediable, polymorphic: true
  has_many   :visits, as: :visitable, dependent: :destroy
  has_many   :activities, as: :object

  attr_accessor :actor

  validates :user_id,
            presence: true,
            numericality: { only_integer: true }
  validates :attachmentable, presence: true

  after_create :log_activity_creating, unless: -> (media) { media.skip_creation_callbacks? }
  # after_save :send_media_count_in_album_notification, if: -> (media) { media.album_id_changed? }
  after_destroy :send_media_count_in_album_notification, if: -> (media) { media.album.present? }
  after_update :log_activity_updating
  after_destroy :hide_all_activities
  after_destroy :log_activity_destroying
  after_destroy :remove_associated_notifications

  scope :available_in_user_gallery, -> { where(mediable_type: ['Widgets::GalleryWidget::Gallery', nil]) }

  scope :newest, -> { order(created_at: :desc) }

  def skip_creation_callbacks!
    @skip_creation_callbacks = true
  end

  def skip_creation_callbacks?
    !!@skip_creation_callbacks
  end

  def force_activity_creating!
    log_activity_creating
  end

  def thumb_url
    case attachmentable_type
      when 'Attachments::Picture' then attachmentable.file_url(:thumb)
      when 'Attachments::Video'   then attachmentable.thumbnail
      else ''
    end
  rescue Exception => e
    ''
  end

  def gallery
    mediable_type == 'Widgets::GalleryWidget::Gallery' ? mediable : nil
  end

  def type
    attachmentable_type.present? ? attachmentable_type.sub(/Attachments::/, '').downcase : ''
  end

  def privacy
    if self.album.present?
      album.privacy
    else
      "p_private"
    end
  end

  private

  def log_activity_creating
    extra_data = {title: self.title}

    if self.mediable_type.blank? or self.mediable_type == 'Widgets::GalleryWidget::Gallery'  # media available in Gallery
      feed = self.type == 'video' ? false : true    # FIXME ?
      bubble = self.try(:mediable).try(:bubble)
    else
      feed = false
      bubble = nil
    end

    if bubble.present?
      activity_name = 'galleries.create_media'
      privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
      extra_data.merge!(bubble: {name: bubble.name})
    elsif self.album_id.present?
      activity_name = 'albums.create_media'
      privacy = Activity.privacies[:p_private]
    else
      activity_name = 'media.create'
      privacy = Activity.privacies[:p_private]
    end

    if self.album_id.present?
      extra_data.merge!(album: {name: self.album.name, id: self.album.id})
    end

    Activity.create(name: activity_name, user_id: self.uploader.id, user_ip: self.uploader.current_sign_in_ip,
                    object_id: self.id, object_type: self.class.name, privacy: privacy, feed: feed,
                    bubble_id: bubble.try(:id), extra_data: extra_data)
  end

  def log_activity_updating
    privacy = self.mediable_type == 'Widgets::GalleryWidget::Gallery' ? Activity.privacies[:p_friends] : Activity.privacies[:p_private]
    Activity.create(name: "media.update", user_id: self.uploader.id, user_ip: self.uploader.current_sign_in_ip,
                    object_id: self.id, object_type: self.class.name, privacy: privacy)
  end

  def hide_all_activities
    # hide associated activities (feed items)
    Activity.where(feed: true, object_id: self.id, object_type: self.class.name).update_all(feed: false)
  end

  def log_activity_destroying
    bubble = self.try(:mediable).try(:bubble)
    privacy = self.mediable_type == 'Widgets::GalleryWidget::Gallery' ? Activity.privacies[:p_friends] : Activity.privacies[:p_private]
    Activity.create(name: "media.destroy", user_id: self.actor.try(:id), user_ip: self.actor.try(:current_sign_in_ip),
                    object_id: self.id, object_type: self.class.name, privacy: privacy, feed: false, bubble_id: bubble.try(:id))

    # destroy invalid madiable object if it contain only this media
    mediable_destroyed = false
    if self.mediable.present? and self.mediable.invalid?
      mediable = self.mediable
      if mediable.respond_to?(:actor)
        mediable.actor = self.actor
        mediable.actor ||= User.find_by(id: self.user_id) unless self.user_id.nil?
        mediable.actor ||= User.find_by(id: mediable.user_id) if mediable.respond_to?(:user_id)
      end
      mediable.destroy
      mediable_destroyed = mediable.destroyed?
    end

    # realtime notifications
    data = {
        medium_id: self.id,
        bubble_id: bubble.try(:id)
    }

    case self.mediable_type
      when '', nil
        if self.privacy == 'p_public'
          channel_name = "profile-page-#{self.user_id}"
          event_name = 'media_destroyed'
        else
          channel_name = nil
        end
      when 'Widgets::GalleryWidget::Gallery'
        if bubble.present?
          channel_name = "private-gallery-widget-#{self.mediable_id}"
          event_name = 'gallery_item_removed'
        else
          channel_name = nil
        end
      when 'Widgets::BlogWidget::Blog'
        if bubble.present?
          channel_name = "private-bubble-#{bubble.permalink}"
          event_name = mediable_destroyed ? 'post_destroyed' : 'post_updated'
          data.merge!(post_id: self.mediable_id)
        else
          channel_name = nil
        end
      when 'Widgets::ChatWidget::Message'
        if self.mediable.present?
          channel_name = "private-chatwidget-#{self.mediable.chat_id}"
          event_name = mediable_destroyed ? 'message_destroyed' : 'message_updated'
          data.merge!(message_id: self.mediable_id)
        else
          channel_name = nil
        end
      when 'WheelChat::Message'
        if self.mediable.present?
          channel_name = "private-messages_#{WheelChat::Chat.channel_name_by_user_ids(self.mediable.user_id, self.mediable.receiver_id)}"
          event_name = mediable_destroyed ? 'message_destroyed' : 'message_updated'
          data.merge!(message_id: self.mediable_id)
        else
          channel_name = nil
        end
      when 'Note'
        channel_name = "private-dashboard-#{self.user_id}"
        event_name = mediable_destroyed ? 'note_destroyed' : 'note_updated'
        data.merge!(note_id: self.mediable_id)
      when 'Comment'
        channel_name = 'global'
        event_name = mediable_destroyed ? 'comment_destroyed' : 'comment_updated'
        data.merge!(comment_id: self.mediable_id)
      else
        channel_name = nil
    end

    unless channel_name.nil?
      ws_msg = {
          adapter: 'pusher',
          channel: channel_name,
          event: event_name,
          data: data,
          debug_info: {
              location: 'Medium#log_activity_destroying',
              user_id: self.actor.try(:id) || self.user_id,
              channel: channel_name,
              event: event_name
          }
      }
      RealTimeNotificationJob.perform_later(ws_msg)
    end
  end

  def remove_associated_notifications
    ids = Activity.where(object_type: self.class.name, object_id: self.id).ids
    Notification.destroy_all(object_type: 'Activity', object_id: ids)
  end

  def send_media_count_in_album_notification
    if self.gallery.nil?
      channel = "profile-page-#{self.album.user_id}"
      bubble_data = {}
    else
      bubble = self.gallery.bubble
      return if bubble.nil?

      channel = "private-bubble-#{bubble.permalink}"
      bubble_data = { id: bubble.id, permalink: bubble.permalink }
    end

    ws_msg = {
        adapter: 'pusher',
        channel: channel,
        event: 'album_media_count_changed',
        data: {
            album: {
                id: self.album.id,
                media_count: self.album.media.count
            },
            bubble: bubble_data
        },
        debug_info: {
            location: 'Medium#send_media_count_in_album_notification',
            user_id: self.album.user_id,
            channel: channel,
            event: 'album_media_count_changed'
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
