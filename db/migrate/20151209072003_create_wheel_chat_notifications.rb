class CreateWheelChatNotifications < ActiveRecord::Migration
  def change
    create_table :wheel_chat_notifications do |t|
      t.integer :user_id
      t.integer :initiator_id
      t.string :channel_name

      t.timestamps null: false
    end
  end
end
