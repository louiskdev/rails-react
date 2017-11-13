class AddReceiverIdColumnToWheelChatMessagesTable < ActiveRecord::Migration
  def up
    add_column :wheel_chat_messages, :receiver_id, :integer

    WheelChat::Message.find_in_batches do |messages|
      messages.each do |msg|
        ids = msg.chat.user_ids
        receiver_id = msg.user_id == ids[0] ? ids[1] : ids[0]
        msg.update_column(:receiver_id, receiver_id)
      end
    end

  end

  def down
    remove_column :wheel_chat_messages, :receiver_id
  end
end
