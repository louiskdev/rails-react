Widgets::ChatWidget::ChatType = GraphQL::ObjectType.define do
  name "Chat"
  description "Chat widget entry"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Chat ID"
  field :created_at, types.String, "Creation date of this chat"
  field :updated_at, types.String, "The latest modification date of this chat"
  field :enabled, -> { types.Boolean }, "Flag, showing whether widget is active now or not" do
    resolve -> (chat, args, ctx) { chat.widget.enabled? }
  end
  connection :online_members, -> { UserType.connection_type }, "Online members list" do
    resolve -> (chat, args, ctx) { chat.users }
  end
  connection :history, -> { Widgets::ChatWidget::MessageType.connection_type }, "Messages of this chat" do
    argument :order_by, types.String, "Available values: 'date'. It is optional."
    argument :reverse_order, types.Boolean

    resolve -> (chat, args, ctx) do
      user = ctx[:current_user]
      if user.present? and user.is_member_of?(chat.widget.bubble)
        messages = chat.messages
        messages = messages.order(:created_at) if args[:order_by] == 'date'
        messages = messages.reverse_order if args[:reverse_order]
        messages
      else
        []
      end
    end
  end
  connection :channels, -> { Widgets::ChatWidget::ChannelType.connection_type }, "Channels of this chat" do
    resolve -> (chat, args, ctx) do
      user = ctx[:current_user]
      if user.present? and user.is_member_of?(chat.widget.bubble)
        chat.channels
        .where(kind: ::Widgets::ChatWidget::Channel.kinds[:global])
        .order(id: :asc, kind: :asc)
      else
        []
      end
    end
  end
  connection :private_channels, -> { Widgets::ChatWidget::ChannelType.connection_type }, "Private channels of this chat" do
    resolve -> (chat, args, ctx) do
      user = ctx[:current_user]
      if user.present? and user.is_member_of?(chat.widget.bubble)
        chat.channels
        .joins('JOIN chat_widget_channel_members ON chat_widget_channels.id = chat_widget_channel_members.channel_id AND chat_widget_channel_members.user_id = ' + user.id.to_s)
        .where(kind: ::Widgets::ChatWidget::Channel.kinds[:privy])
        .order(id: :asc, kind: :asc)
      else
        []
      end
    end
  end
end
