class Friendship < ActiveRecord::Base
  enum status: [:pending, :approved, :blocked]

  belongs_to :user
  belongs_to :friend, class_name: 'User'

  validates :user_id,
            presence: true,
            numericality: { only_integer: true }
  validates :friend_id,
            presence: true,
            numericality: { only_integer: true },
            uniqueness: { scope: :user_id }
  validates :status,
            presence: true
  validate :check_friendship

  after_create  :new_friend_notification
  after_update  :update_status_notification
  after_destroy :destroy_friendship_notification
  after_destroy :destroy_former_friend_notifications

  private

  def check_friendship
    if self.user_id == self.friend_id
      self.errors.add(:friend_id, 'You cannot friend yourself (fields `friend_id` and `user_id` cannot be equal)')
    end
  end

  def new_friend_notification
    if self.pending?
      Notification.create(user_id: self.user_id, initiator_type: 'User', initiator_id: self.friend_id, name: "friendships:create")
    elsif self.approved?
      Notification.create(user_id: self.user_id, initiator_type: 'User', initiator_id: self.friend_id, name: "friendships:approve")
    end
  end

  def update_status_notification
    if self.status_changed?
      if self.approved?
        Notification.create(user_id: self.user_id, initiator_type: 'User', initiator_id: self.friend_id, name: "friendships:approve")
        Friendship.create(friend_id: self.user_id, user_id: self.friend_id, status: Friendship.statuses[:approved])
      end
    end
  end

  def destroy_friendship_notification
    if self.approved?
      Notification.create(user_id: self.user_id, initiator_type: 'User', initiator_id: self.friend_id, name: "friendships:destroy")
    # elsif self.pending?
    #   Notification.create(user_id: self.friend_id, initiator_type: 'User', initiator_id: self.user_id, name: "friendships:decline")
    end
  end

  def destroy_former_friend_notifications
    Notification.destroy_all(user_id: self.user_id, initiator_type: 'User', initiator_id: self.friend_id)
    # realtime notification
    ws_msg = {
        adapter: 'pusher',
        channel: "private-user-#{self.user_id}",
        event: 'important',
        data: {
            message: 'need_to_reload_notifications',
        },
        debug_info: {
            location: 'Friendship#destroy_friend_notifications',
            friendship_id: self.try(:id),
            friend_id: self.friend_id,
            user_id: self.user_id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end
end
