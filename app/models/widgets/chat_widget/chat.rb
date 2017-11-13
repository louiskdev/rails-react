module Widgets
  module ChatWidget
    class Chat < ActiveRecord::Base
      include ::Chat::Base
      include Common

      has_one :widget, as: :widgetable
      has_one :bubble, through: :widget
      has_many :online, dependent: :destroy
      has_many :users, through: :online
      has_many :messages, dependent: :destroy
      has_many :channels, dependent: :destroy

      def create_default_channel(user_id)
        default_channel = self.channels.build(name: 'general', kind: Widgets::ChatWidget::Channel.kinds[:global])
        default_channel.creator_id = user_id
        default_channel.save()
        default_channel
      end
    end
  end
end
