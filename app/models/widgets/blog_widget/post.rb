module Widgets
  module BlogWidget
    class Post < ActiveRecord::Base
      include Common
      include ::Post::Base
      include Mention
      include HashtagProcessing

      belongs_to :blog, class_name: 'Widgets::BlogWidget::Blog'

      attr_accessor :actor

      validates :user_id, presence: true

      after_create :log_activity_creating
      after_create :notify_bubble_members
      after_update :log_activity_updating
      after_destroy :hide_activities_and_notify_users
      after_destroy :log_activity_destroying

      # Helper method to give process_mentions method content of comment
      def mentioning_text
        self.text
      end

      private

      def log_activity_creating
        bubble = self.blog.bubble
        privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "blogs.create_post", user_id: self.user.id, user_ip: self.user.current_sign_in_ip,
                        object_id: self.id, object_type: self.class.name, privacy: privacy, feed: true,
                        bubble_id: bubble.id)
      end

      def notify_bubble_members
        bubble_id = self.blog.bubble.id rescue nil
        BackgroundJob.perform_later(self.class.name, 'notify_bubble_members_bg', bubble_id)
      end

      def self.notify_bubble_members_bg(bubble_id)
        bubble = Bubble.find_by(id: bubble_id)
        return if bubble.nil?

        ws_msg = {
            event: 'bubble_blog_items_count_changed',
            data: {
                bubble: {
                    id: bubble.id,
                    permalink: bubble.permalink
                }
            },
            debug_info: {
                location: "#{self.name}.notify_bubble_members_bg",
                event: 'bubble_blog_items_count_changed'
            }
        }

        bubble.online_members.each do |user|
          date = user.attendances.find_by(url: "/bubbles/#{bubble.permalink}", section: "bubble_blog").try(:latest_date) || DateTime.ordinal(0)
          unread_count = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
              where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND ignorings.user_id <> :user_id)', model: 'Activity', user_id: user.id).
              where(bubble_id: bubble.id, feed: true, shared: false, object_type: 'Widgets::BlogWidget::Post').
              where('activities.created_at > ?', date).count

          ws_msg[:channel] = "private-user-#{user.id}"
          ws_msg[:data][:unread_activities_count] = unread_count
          ws_msg[:debug_info][:channel] = "private-user-#{user.id}"
          PusherNotifier.forward(ws_msg)
        end
      end

      def log_activity_updating
        bubble_id = self.blog.widget.bubble_id rescue nil
        Activity.create(name: "blogs.update_post", user_id: self.actor.id, user_ip: self.actor.current_sign_in_ip,
                        object_id: self.id, object_type: self.class.name, privacy: Activity.privacies[:p_private],
                        feed: false, bubble_id: bubble_id)
      end

      def log_activity_destroying
        bubble_id = self.blog.widget.bubble_id rescue nil
        BackgroundJob.perform_later(self.class.name, 'log_activity_destroying_bg', self.id, self.actor.try(:id), bubble_id)
      end

      def self.log_activity_destroying_bg(post_id, user_id, bubble_id)
        user_ip = User.where(id: user_id).pluck(:current_sign_in_ip).first
        Activity.create(name: "blogs.destroy_post", user_id: user_id, user_ip: user_ip, feed: false,
                        privacy: Activity.privacies[:p_private], bubble_id: bubble_id, extra_data: {id: post_id})
      end

      def hide_activities_and_notify_users
        user_id = self.actor.try(:id)
        bubble_permalink = self.blog.bubble.permalink rescue nil
        BackgroundJob.perform_later(self.class.name, 'hide_activities_and_notify_users_bg', self.id, user_id, bubble_permalink)
      end

      def self.hide_activities_and_notify_users_bg(post_id, user_id, bubble_permalink)
        activity_ids = Activity.where(object_id: post_id, object_type: self.name, feed: true).ids
        # hide all visible activities
        Activity.where(id: activity_ids).update_all(feed: false)

        # real-time notifications
        user = User.find_by(id: user_id)
        shared_msg = {
            event: 'post_removed',
            data: {
                post_data: {
                    post_id: post_id,
                    activity_ids: activity_ids
                },
                user_data: {
                    username: user.try(:username)
                }
            },
            debug_info: {
                location: "#{self.name}.hide_activities_and_notify_users_bg",
                post_id: post_id,
                activity_ids: activity_ids,
                username: user.try(:username)
            }
        }

        if bubble_permalink
          ws_msg = shared_msg.merge(channel: "private-bubble-#{bubble_permalink}")
          ws_msg[:debug_info][:desc] = "Notify bubble's members"
          PusherNotifier.forward(ws_msg)
        end

        if user.present?
          ws_msg = shared_msg.merge(channel: "private-dashboard-#{user.id}")
          ws_msg[:debug_info][:desc] = 'Notify the author'
          PusherNotifier.forward(ws_msg)

          online_friend_ids = user.friends.online_users.ids
          unless online_friend_ids.empty?
            channels = online_friend_ids.map { |friend_id| "private-dashboard-#{friend_id}" }
            ws_msg = shared_msg.merge(channel: channels)
            ws_msg[:debug_info][:desc] = 'Notify friends'
            PusherNotifier.forward(ws_msg)
          end
        end
      end

    end
  end
end
