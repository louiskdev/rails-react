module WheelChat
  module Common
    extend ActiveSupport::Concern

    class_methods do
      def table_name_prefix
        'wheel_chat_'
      end
    end

  end
end
