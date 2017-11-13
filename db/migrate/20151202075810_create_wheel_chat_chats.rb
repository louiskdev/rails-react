class CreateWheelChatChats < ActiveRecord::Migration
  def change
    create_table :wheel_chat_chats do |t|
      t.string :channel_name

      t.timestamps null: false
    end
  end
end
