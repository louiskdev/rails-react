class Activity < ActiveRecord::Base
  enum privacy: [:p_public, :p_x1, :p_x2, :p_friends, :p_y1, :p_y2, :p_private]
  belongs_to :user
  belongs_to :object, polymorphic: true
  has_many   :ignorings, as: :ignorable, dependent: :destroy
  has_many   :favorite_activities, dependent: :destroy

  delegate :root_comments, to: :object

  after_create :notify_by_websockets

  scope :newest, -> { order(created_at: :desc) }
  scope :shared, -> { where(shared: true) }

  def self.friends_feed_activities(user)
    friend_ids = user.friends.ids
    bubble_ids = user.bubbles.ids
    sql_clause = '((activities.privacy IN (0, 3) AND (activities.object_type IN (:types)))' # public activities associated to friends dashboard posts (notes)
    sql_clause << " OR (activities.bubble_id IN (:bubble_ids) AND bubble_members.user_id IN (:friend_ids))) AND activities.name NOT IN ('bubbles.upload_avatar', 'bubbles.upload_cover', 'bubbles.join_user', 'bubbles.disjoin_user')" # private activities from private bubbles user is a member of
    # sql_clause << " OR (activities.privacy IN (0, 3) AND activities.name = 'bubbles.create')"
    Activity.distinct.includes(:user).joins('LEFT JOIN ignorings ON activities.id = ignorings.ignorable_id').
        joins('LEFT OUTER JOIN bubbles ON activities.bubble_id = bubbles.id').
        joins('LEFT JOIN bubble_members ON bubbles.id = bubble_members.bubble_id').
        where(user_id: friend_ids, feed: true).where(sql_clause, types: ['Note'], bubble_ids: bubble_ids, friend_ids: friend_ids).
        where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND (ignorings.user_id <> :user_id OR (ignorings.location <> \'friends_feed\' AND ignorings.location <> \'activity\')))',
              model: 'Activity', user_id: user.id)
  end

  def user_friendly_name(options={})
    case name
      when 'bubbles.create' then 'created the bubble'
      when 'bubbles.update' then 'updated the bubble'
      when 'bubbles.destroy' then 'destroyed the bubble'
      when 'bubbles.join_user' then 'has joined the bubble'
      when 'bubbles.disjoin_user' then 'has left the bubble'
      when 'bubbles.upload_cover' then 'changed the cover image'
      when 'bubbles.upload_avatar' then 'changed the avatar'
      when 'bubbles.ban_user' then 'has been banned from the bubble'
      when 'bubbles.unban_user' then 'has been unbanned from the bubble'

      when 'galleries.create_media' then 'uploaded a new video/image to gallery'
      when 'galleries.update_media' then 'updated the video/image in gallery'
      when 'galleries.destroy_media' then 'removed the video/image from gallery'
      when 'galleries.create_album' then 'added a new album to gallery'
      when 'galleries.update_album' then 'updated the album in gallery'
      when 'galleries.destroy_album' then 'removed the album from gallery'

      when 'blogs.create_post' then 'wrote a post on'
      when 'blogs.update_post' then 'updated post in blog'
      when 'blogs.destroy_post' then 'removed post from blog'

      when 'albums.create_media' then 'uploaded a new video/image to album'
      when 'albums.destroy_media' then 'removed the video/image from album'

      when 'media.create' then 'uploaded a new video/image'
      when 'media.update' then 'updated the video/image'
      when 'media.destroy' then 'destroyed the video/image'
      when 'media.put_media' then 'uploaded a new video/image to gallery'
      when 'media.share' then 'shared media file'

      when 'notes.create' then options[:feed_type] == 'own' ? 'wrote on your profile' : 'wrote a new note'
      when 'notes.destroy' then 'destroyed the note'

      when 'events.create' then 'created event'

      when 'activities.share' then 'shared a record'
      else
        name
    end
  end

  private
  def notify_by_websockets
    BackgroundJob.perform_later('Activity', 'notify_by_websockets_bg', self.id)
  end

  def self.notify_by_websockets_bg(activity_id)
    activity = Activity.find_by(id: activity_id)
    return if activity.nil?

    if activity.feed?
      if activity.bubble_id.present?
        bubble = Bubble.find_by(id: activity.bubble_id.to_i)
        return if ['bubbles.join_user', 'bubbles.disjoin_user'].include?(activity.name) and !bubble.privy?

        unless bubble.nil?
          online_bubble_members = bubble.members.where.not(id: activity.user_id).where(id: User.online_users)
          json = ApplicationController.new.render_to_string(partial: 'api/v1/shared/bubble_activities', locals: { activities: [activity], feed_type: 'bubbles' })
          data = JSON.parse json

          # real-time notification
          # Pusher.trigger("private-bubble-#{bubble.permalink}", 'feed_item_added', data.merge!(type: 'bubble_feed')) unless bubble.nil?

          shared_ws_msg = {
            channel: "private-bubble-#{bubble.permalink}",
            event: 'feed_item_added',
            data: data.merge(type: 'bubble_feed'),
            debug_info: {
              location: 'Activity#notify_by_websockets',
              user_id: activity.user_id,
              channel: "private-bubble-#{bubble.permalink}",
              type: 'bubble_feed'
            }
          }
          PusherNotifier.forward(shared_ws_msg)

          if activity.name == 'galleries.create_media'
            gallery_id = bubble.gallery_widget.try(:id)
            unless gallery_id.nil?
              shared_ws_msg[:channel] = "private-gallery-widget-#{gallery_id}"
              shared_ws_msg[:event] = 'gallery_item_added'
              shared_ws_msg[:debug_info][:channel] = shared_ws_msg[:channel]
              PusherNotifier.forward(shared_ws_msg)

              # realtime unread items count in gallery
              online_bubble_members.each do |user|
                ws_msg = {
                    channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                    event: 'gallery_unread_items_count_changed',
                    data: {
                        bubble: {
                            id: bubble.id,
                            permalink: bubble.permalink
                        },
                        gallery_unread_items_count: bubble.gallery_unread_items_count_by_user(user),
                        total_unread_items_count: bubble.total_unread_items_count_by_user(user)
                    },
                    debug_info: {
                        location: 'Activity#notify_by_websockets',
                        user_id: activity.user_id,
                        channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                        event: 'gallery_unread_items_count_changed'
                    }
                }
                PusherNotifier.forward(ws_msg)
              end
            end
          elsif activity.name == 'blogs.create_post'
            blog_id = bubble.blog_widget.try(:id)
            unless blog_id.nil?
              shared_ws_msg[:channel] = "private-blog-widget-#{blog_id}"
              shared_ws_msg[:event] = 'blog_item_added'
              shared_ws_msg[:debug_info][:channel] = shared_ws_msg[:channel]
              PusherNotifier.forward(shared_ws_msg)

              # realtime unread items count in blog
              online_bubble_members.each do |user|
                ws_msg = {
                    channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                    event: 'blog_unread_items_count_changed',
                    data: {
                        bubble: {
                            id: bubble.id,
                            permalink: bubble.permalink
                        },
                        blog_unread_items_count: bubble.blog_unread_items_count_by_user(user),
                        total_unread_items_count: bubble.total_unread_items_count_by_user(user)
                    },
                    debug_info: {
                        location: 'Activity#notify_by_websockets',
                        user_id: activity.user_id,
                        channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                        event: 'blog_unread_items_count_changed'
                    }
                }
                PusherNotifier.forward(ws_msg)
              end
            end
          elsif activity.name == 'events.create'
            events_widget_id = bubble.events_widget.try(:id)
            unless events_widget_id.nil?
              shared_ws_msg[:channel] = "private-events-widget-#{events_widget_id}"
              shared_ws_msg[:event] = 'event_item_added'
              shared_ws_msg[:debug_info][:channel] = shared_ws_msg[:channel]
              PusherNotifier.forward(shared_ws_msg)

              # realtime unread items count in gallery
              online_bubble_members.each do |user|
                ws_msg = {
                    channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                    event: 'events_unread_items_count_changed',
                    data: {
                        bubble: {
                            id: bubble.id,
                            permalink: bubble.permalink
                        },
                        events_unread_items_count: bubble.events_unread_items_count_by_user(user),
                        total_unread_items_count: bubble.total_unread_items_count_by_user(user)
                    },
                    debug_info: {
                        location: 'Activity#notify_by_websockets',
                        user_id: activity.user_id,
                        channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                        event: 'events_unread_items_count_changed'
                    }
                }
                PusherNotifier.forward(ws_msg)
              end
            end
          end

          # realtime unread items count in feed
          online_bubble_members.each do |user|
            ws_msg = {
                channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                event: 'feed_unread_items_count_changed',
                data: {
                    bubble: {
                        id: bubble.id,
                        permalink: bubble.permalink
                    },
                    feed_unread_items_count: bubble.feed_unread_items_count_by_user(user),
                    total_unread_items_count: bubble.total_unread_items_count_by_user(user)
                },
                debug_info: {
                    location: 'Activity#notify_by_websockets',
                    user_id: activity.user_id,
                    channel: "private-bubble-#{bubble.permalink}-#{user.id}",
                    event: 'feed_unread_items_count_changed'
                }
            }
            PusherNotifier.forward(ws_msg)
          end

          online_bubble_members.each do |user|
            ws_msg = {
                channel: "private-dashboard-#{user.id}",
                event: 'total_unread_items_count_changed',
                data: {
                    total_unread_items_count: bubble.total_unread_items_count_by_user(user),
                    bubble: {
                        id: bubble.id,
                        permalink: bubble.permalink
                    }
                },
                debug_info: {
                    location: 'Activity#notify_by_websockets',
                }
            }
            PusherNotifier.forward(ws_msg)
          end

        end
      end

      if activity.user_id.present?
        return if ['bubbles.join_user', 'bubbles.disjoin_user'].include?(activity.name)

        json = ApplicationController.new.render_to_string(partial: 'api/v1/users/feed', locals: { activities: [activity], feed_type: 'own', unread_activities_count: 0 })
        data = JSON.parse json

        # real-time notification
        # Pusher.trigger("private-dashboard-#{self.user_id}", 'feed_item_added', data.merge!(type: 'own_feed'))
        ws_msg = {
            channel: "private-dashboard-#{activity.user_id}",
            event: 'feed_item_added',
            data: data.merge(type: 'own_feed'),
            debug_info: {
                location: 'Activity#notify_by_websockets',
                user_id: activity.user_id,
                channel: "private-dashboard-#{activity.user_id}",
                type: 'own_feed'
            }
        }
        PusherNotifier.forward(ws_msg)

        if activity.p_public? or activity.p_friends?
          json = ApplicationController.new.render_to_string(partial: 'api/v1/users/feed', locals: { activities: [activity], feed_type: 'friends', unread_activities_count: 1 })
          data = JSON.parse json
          online_friends_ids = User.find(activity.user_id).friends.online_users.ids
          online_friends_ids.each do |friend_id|
            current_user = User.find(friend_id)
            last_attendance_date = current_user.attendances.find_by(url: '/dashboard', section: 'friends_feed').latest_date rescue DateTime.ordinal(0)
            unread_activities_count = Activity.friends_feed_activities(current_user).where('activities.created_at > ?', last_attendance_date).count

            # real-time notification
            # Pusher.trigger("private-dashboard-#{friend_id}", 'feed_item_added', data.merge!(type: 'friends_feed', unread_activities_count: unread_activities_count))
            ws_msg = {
                channel: "private-dashboard-#{friend_id}",
                event: 'feed_item_added',
                data: data.merge(type: 'friends_feed', unread_activities_count: unread_activities_count),
                debug_info: {
                    location: 'Activity#notify_by_websockets',
                    user_id: activity.user_id,
                    channel: "private-dashboard-#{friend_id}",
                    type: 'friends_feed'
                }
            }
            PusherNotifier.forward(ws_msg)
          end
        elsif activity.p_private?
          online_friend_ids = User.find_by(id: activity.user_id).friends.online_users.ids
          member_ids = BubbleMember.where(bubble_id: activity.bubble_id.to_i).pluck(:user_id)
          receiver_ids = online_friend_ids & member_ids
          unless receiver_ids.blank?
            json = ApplicationController.new.render_to_string(partial: 'api/v1/users/feed', locals: { activities: [activity], feed_type: 'friends', unread_activities_count: 1 })
            data = JSON.parse json
            receiver_ids.each do |user_id|
              current_user = User.find_by(id: user_id)
              last_attendance_date = current_user.attendances.find_by(url: '/dashboard', section: 'friends_feed').latest_date rescue DateTime.ordinal(0)
              unread_activities_count = Activity.friends_feed_activities(current_user).where('activities.created_at > ?', last_attendance_date).count

              # real-time notification
              # Pusher.trigger("private-dashboard-#{user_id}", 'feed_item_added', data.merge!(type: 'friends_feed', unread_activities_count: unread_activities_count))
              ws_msg = {
                  channel: "private-dashboard-#{user_id}",
                  event: 'feed_item_added',
                  data: data.merge(type: 'friends_feed', unread_activities_count: unread_activities_count),
                  debug_info: {
                      location: 'Activity#notify_by_websockets',
                      user_id: activity.user_id,
                      channel: "private-dashboard-#{user_id}",
                      type: 'friends_feed'
                  }
              }
              PusherNotifier.forward(ws_msg)
            end
          end
        end
      end
    end
  end
end
