class CreateWidgetsChatWidgetChannelMembers < ActiveRecord::Migration
  def change
    create_table :chat_widget_channel_members do |t|
      t.integer :channel_id
      t.integer :user_id
    end
  end
end
