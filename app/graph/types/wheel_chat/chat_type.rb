WheelChat::ChatType = GraphQL::ObjectType.define do
  name "WheelChat"
  description "Wheelchat (1v1 chat) entry"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Chat ID"
  field :channel_name, types.String, "Channel name of this chat"
  field :mute, types.Boolean, "Sound option (true if disabled)"
  field :created_at, types.String, "Creation date of this chat"
  field :updated_at, types.String, "The latest modification date of this chat"
  field :user_ids, types.Int.to_list_type, "Chat member's IDs"
  field :members, UserType.to_list_type, "Members of this chat"
  connection :history, -> { WheelChat::MessageType.connection_type }, "Messages of this chat" do
    argument :order_by, types.String
    argument :reverse_order, types.Boolean

    resolve -> (chat, args, ctx) do
      user = ctx[:current_user]
      if user.present? and chat.has_member?(user)
        messages = chat.messages
        messages = messages.order(:created_at) if args[:order_by] == 'date'
        messages = messages.reverse_order if args[:reverse_order]
        messages
      else
        []
      end
    end
  end
  field :missed_messages_count, types.Int, "Number of messages missed by current user in this chat" do
    resolve -> (chat, args, ctx) do
      user = ctx[:current_user]
      if user.present? and chat.has_member?(user)
        user.wheel_chat_notifications.where(channel_name: chat.channel_name).count
      else
        nil
      end
    end
  end

end
