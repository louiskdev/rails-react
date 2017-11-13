class CreateChatWidgetChat < ActiveRecord::Migration
  def change
    create_table :chat_widget_chats do |t|
      t.timestamps null: false
    end
  end
end
