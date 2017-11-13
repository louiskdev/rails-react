WheelChat::MessageType = GraphQL::ObjectType.define do
  name "WheelChatMessage"
  description "Wheelchat (1v1 chat) message entry"

  interfaces [GraphQL::Relay::Node.interface,
             HasAuthorInterface,
             HasMediumInterface,
             HasLinkPreviewInterface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Message ID"
  field :text, types.String, "Text of this message"
  field :chat_id, types.Int, "Associated wheelchat ID"
  field :chat, WheelChat::ChatType, "Associated wheelchat entry"
  field :video_url, types.String, "External video resource url"
  field :read_at, types.String, "Date when the message was read by receiver"
  field :created_at, types.String, "Creation date of this chat"
  field :updated_at, types.String, "The latest modification date of this chat"
  field :i_am_author, types.Boolean, 'True if current user wrote this message' do
    resolve -> (msg, args, ctx) { ctx[:current_user].present? ? msg.user == ctx[:current_user] : nil }
  end

end
