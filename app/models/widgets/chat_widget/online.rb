module Widgets
  module ChatWidget
    class Online < ActiveRecord::Base
      include Common

      belongs_to :user
      belongs_to :chat

      validates :user_id,
                presence: true,
                numericality: {only_integer: true}

      validates :chat_id,
                presence: true,
                numericality: {only_integer: true}

      validates :chat_id, uniqueness: {scope: :user_id}

    end
  end
end
