class BubbleBlockedUser < ActiveRecord::Base
  belongs_to :blocked_user, class_name: "User", foreign_key: :user_id
  belongs_to :bubble

  after_create :notification_creating
  after_destroy :notification_destroying

  def notification_creating
    bubble = self.bubble
    user = self.blocked_user

    bubble.members.each do |member|
      notification = Notification.create(user_id: member.id,
        initiator_type: 'User',
        initiator_id: user.id,
        object_type: 'Bubble',
        object_id: bubble.id,
        name: 'bubbles.ban_user'
      )
    end

    notification = Notification.create(user_id: user.id,
      initiator_type: 'User',
      initiator_id: user.id,
      object_type: 'Bubble',
      object_id: bubble.id,
      name: 'bubbles.ban_user'
    )
  end

  def notification_destroying
    bubble = self.bubble
    user = self.blocked_user

    bubble.members.each do |member|
      notification = Notification.create(user_id: member.id,
        initiator_type: 'User',
        initiator_id: user.id,
        object_type: 'Bubble',
        object_id: bubble.id,
        name: 'bubble.unban_user'
      )
    end
  end

end
