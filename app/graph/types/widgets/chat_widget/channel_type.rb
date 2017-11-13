Widgets::ChatWidget::ChannelType = GraphQL::ObjectType.define do
  name "Channel"
  description "Chat widget channel"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Channel ID"
  field :kind, types.String, "Type of the channel"
  field :type, !types.String, "Alias for 'kind' field", property: :kind

  field :name, types.String, 'Name of the channel' do
    resolve -> (channel, args, ctx) {
      channel.display_name ctx[:current_user]
    }
  end

  connection :members, -> { UserType.connection_type }, "Members of this channel" do
    resolve -> (channel, args, ctx) do
      channel.members
    end
  end

  connection :history, -> { Widgets::ChatWidget::MessageType.connection_type }, "Messages of this channel" do
    argument :order_by, types.String, "Available values: 'date'. It is optional."
    argument :reverse_order, types.Boolean

    resolve -> (channel, args, ctx) do
      user = ctx[:current_user]
      if user.present? and user.is_member_of?(channel.chat.widget.bubble)
        messages = channel.messages
        messages = messages.order(:created_at) if args[:order_by] == 'date'
        messages = messages.reverse_order if args[:reverse_order]
        messages
      else
        []
      end
    end
  end
end
