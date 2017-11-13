module WheelChat
  class Message < ActiveRecord::Base
    include ::Chat::Message
    include Common
    include Mention

    # Helper method to give process_mentions method content of comment
    def mentioning_text
      self.text
    end

  end
end
