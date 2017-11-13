module WheelChat
  class Notification < ActiveRecord::Base
    include Common

    belongs_to :user
    belongs_to :initiator, class_name: 'User'

    validates :user_id, presence: true
    validates :initiator_id, presence: true

  end
end
