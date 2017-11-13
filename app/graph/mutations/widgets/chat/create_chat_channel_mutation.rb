Widgets::Chat::CreateChatChannelMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "createChatChannel"
  description I18n.t('graphql.mutations.createChatChannel.description')

  # Accessible from `input` in the resolve function:
  input_field :chat_id, !types.Int, I18n.t('graphql.mutations.createChatChannel.args.chat_id')
  input_field :name, !types.String, I18n.t('graphql.mutations.createChatChannel.args.name')
  input_field :type, types.String, I18n.t('graphql.mutations.createChatChannel.args.type')
  input_field :user_id, types.Int, I18n.t('graphql.mutations.createChatChannel.args.user_id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :channel, -> { Widgets::ChatWidget::ChannelType }

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      chat = Widgets::ChatWidget::Chat.find_by(id: inputs[:chat_id])
      return custom_error('Chat widget not found', ctx) if chat.nil?
      bubble = chat.widget.try(:bubble)
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) unless (user.is_owner_of?(bubble) or user.is_moderator_of?(bubble)) or inputs[:type] == 'privy'

      channel = chat.channels.build(
        name: inputs[:name],
        kind: ::Widgets::ChatWidget::Channel.normalize_kind_attr(inputs[:type]),
        creator_id: user.id
      )
      if channel.save
        if inputs[:type] == 'privy'
          channel_member_me = channel.channel_members.build(user_id: user.id)
          channel_member_me.save
          if inputs[:user_id].present?
            channel_member = channel.channel_members.build(user_id: inputs[:user_id])
            channel_member.save
          end
        end

        # real-time notification
        notify!(chat, channel, user)

        {channel: channel}
      else
        result_if_error_occurred
      end
    end
  end

  def notify!(chat, channel, current_user)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-chatwidget-#{chat.id}",
        event: 'channel_created',
        data: {
            channel: channel.to_hash(current_user)
        },
        debug_info: {
            location: 'Widgets::Chat::CreateChatChannelMutation#notify!',
            chat_id: chat.id,
            channel: channel.to_hash(current_user)
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {channel: nil}
  end

end
