module Mention
  extend ActiveSupport::Concern

  included do
    def process_mentions(current_user_id, bubble = nil)
      text = self.mentioning_text
      return if text.nil?
      results = text.scan(/@[a-zA-Z0-9\_]+/)
      results.each do |result|
        username = result[1..-1]
        user = User.where(username: username).first
        if user.present? and user.id != current_user_id and (bubble.nil? or not(bubble.privy?) or bubble.bubble_members.where(user_id: user.id).count > 0)
          Notification.create(
            user_id: user.id,
            initiator_type: 'User',
            initiator_id: current_user_id,
            object_type: bubble.nil? ? self.class.name : bubble.class.name,
            object_id: bubble.nil? ? self.id : bubble.id,
            name: 'users.mention'
          )
        end
      end
    end

  end

end
