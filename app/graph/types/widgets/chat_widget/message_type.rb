Widgets::ChatWidget::MessageType = GraphQL::ObjectType.define do
  name "ChatMessage"
  description "Chat widget message entry"

  interfaces [GraphQL::Relay::Node.interface,
             HasAuthorInterface,
             HasMediumInterface,
             HasLinkPreviewInterface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Message ID"
  field :text, types.String, "Text of this message"
  field :chat_id, types.Int, "Associated chat widget ID"
  field :chat, -> { Widgets::ChatWidget::ChatType }, "Associated chat widget entry"
  field :video_url, types.String, "External video resource url"
  field :created_at, types.String, "Creation date of this chat"
  field :updated_at, types.String, "The latest modification date of this chat"
  field :i_am_author, types.Boolean, 'True if current user wrote this message' do
    resolve -> (msg, args, ctx) { ctx[:current_user].present? ? msg.user == ctx[:current_user] : nil }
  end

end
