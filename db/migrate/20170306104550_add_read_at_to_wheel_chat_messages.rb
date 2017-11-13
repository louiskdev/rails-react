class AddReadAtToWheelChatMessages < ActiveRecord::Migration
  def change
    add_column :wheel_chat_messages, :read_at, :datetime
  end
end
