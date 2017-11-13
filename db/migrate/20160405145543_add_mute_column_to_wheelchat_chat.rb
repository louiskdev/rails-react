class AddMuteColumnToWheelchatChat < ActiveRecord::Migration
  def change
    add_column :wheel_chat_chats, :mute, :boolean, default: false
  end
end
