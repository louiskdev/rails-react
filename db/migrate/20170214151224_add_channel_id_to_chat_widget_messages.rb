class AddChannelIdToChatWidgetMessages < ActiveRecord::Migration
  def change
    add_column :chat_widget_messages, :channel_id, :integer
  end
end
