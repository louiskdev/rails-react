class CreateChatWidgetOnline < ActiveRecord::Migration
  def change
    create_table :chat_widget_onlines do |t|
      t.integer  :user_id
      t.integer  :chat_id

      t.timestamps null: false
    end
  end
end
