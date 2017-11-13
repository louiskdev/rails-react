module WheelChat
  class Chat < ActiveRecord::Base
    include ::Chat::Base
    include Common

    validates :channel_name,
              presence: true,
              uniqueness: true

    def self.channel_name_by_user_ids(id1, id2)
      if id1 == id2
        ""
      elsif id1 < id2
        "#{id1}_#{id2}"
      else
        "#{id2}_#{id1}"
      end
    end

    def self.channel_name_for_users(user1, user2)
      id1, id2 = user1.id, user2.id
      channel_name_by_user_ids(id1, id2)
    end

    def self.find_by_users(user1, user2)
      channel_name = channel_name_for_users(user1, user2)
      find_by(channel_name: channel_name)
    end

    def user_ids
      self.channel_name.split('_').map {|id| id.to_i } rescue []
    end

    def has_member?(user)
      user_ids.include?(user.id)
    end

    def members
      User.where(id: user_ids)
    end
  end
end
