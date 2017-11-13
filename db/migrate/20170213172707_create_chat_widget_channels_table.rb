class CreateChatWidgetChannelsTable < ActiveRecord::Migration
  def change
    create_table :chat_widget_channels do |t|
      t.integer :chat_id
      t.integer :creator_id
      t.string :name
      t.integer :kind
    end
  end
end
