class CreateWheelChatMessages < ActiveRecord::Migration
  def change
    create_table :wheel_chat_messages do |t|
      t.text    :text
      t.integer :user_id
      t.integer :chat_id
      t.string  :video_url

      t.timestamps null: false
    end
  end
end
