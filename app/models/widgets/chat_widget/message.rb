module Widgets
  module ChatWidget
    class Message < ActiveRecord::Base
      include ::Chat::Message
      include Common
      include Mention

      belongs_to :channel, dependent: :destroy

      after_create :send_unread_messages_count
      after_create :send_total_unread_items_count_in_bubble
      after_update :notify_of_edit
      after_destroy :notify_of_removal

      def send_changes_notification
        notify_of_edit
      end

      # Helper method to give process_mentions method content of comment
      def mentioning_text
        self.text
      end

      private

      def send_unread_messages_count
        bubble = self.chat.bubble rescue nil
        return if bubble.nil?

        ws_msg = {
            adapter: 'pusher',
            event: 'chat_unread_items_count_changed',
            data: {
                bubble: {
                    id: bubble.id,
                    permalink: bubble.permalink
                }
            },
            debug_info: {
                location: 'Widgets::ChatWidget::Message#send_unread_messages_count',
            }
        }

        online_bubble_members = bubble.members.where.not(id: self.user_id).online_users
        online_bubble_members.each do |user|
          ws_msg[:channel] = "private-bubble-#{bubble.permalink}-#{user.id}"
          ws_msg[:data][:chat_unread_items_count] = bubble.chat_unread_items_count_by_user(user)
          ws_msg[:data][:total_unread_items_count] = bubble.total_unread_items_count_by_user(user)
          RealTimeNotificationJob.perform_later(ws_msg)
        end
      end

      def send_total_unread_items_count_in_bubble
        bubble = self.chat.bubble rescue nil
        return if bubble.nil?

        ws_msg = {
            adapter: 'pusher',
            event: 'total_unread_items_count_changed',
            data: {
                bubble: {
                    id: bubble.id,
                    permalink: bubble.permalink
                }
            },
            debug_info: {
                location: 'Widgets::ChatWidget::Message#send_total_unread_items_count_in_bubble',
            }
        }

        online_bubble_members = bubble.members.where.not(id: self.user_id).online_users
        online_bubble_members.each do |user|
          ws_msg[:channel] = "private-dashboard-#{user.id}"
          ws_msg[:data][:total_unread_items_count] = bubble.total_unread_items_count_by_user(user)
          RealTimeNotificationJob.perform_later(ws_msg)
        end
      end

      def notify_of_edit
        # real-time notification
        ws_msg = {
            adapter: 'pusher',
            channel: "private-chatwidget-#{self.chat_id}",
            event: 'message_updated',
            data: {
                message: self.to_hash
            },
            debug_info: {
                location: 'Widgets::ChatWidget::Message#notify_of_edit',
                message_id: self.id,
                author_id: self.user_id,
                message: self.to_hash
            }
        }
        RealTimeNotificationJob.perform_later(ws_msg)
      end

      def notify_of_removal
        # real-time notification
        ws_msg = {
            adapter: 'pusher',
            channel: "private-chatwidget-#{self.chat_id}",
            event: 'message_destroyed',
            data: {
                message: nil
            },
            debug_info: {
                location: 'Widgets::ChatWidget::Message#notify_of_removal',
                message_id: self.id,
                author_id: self.user_id
            }
        }
        RealTimeNotificationJob.perform_later(ws_msg)
      end

    end
  end
end
