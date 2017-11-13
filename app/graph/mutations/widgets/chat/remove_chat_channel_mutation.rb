Widgets::Chat::RemoveChatChannelMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "removeChatChannel"
  description I18n.t('graphql.mutations.removeChatChannel.description')

  # Accessible from `input` in the resolve function:
  input_field :channel_id, !types.Int, I18n.t('graphql.mutations.removeChatChannel.args.channel_id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      channel = Widgets::ChatWidget::Channel.find_by(id: inputs[:channel_id])
      return custom_error('Chat widget channel not found', ctx) if channel.nil?

      chat = channel.chat
      bubble = chat.widget.try(:bubble)
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) unless user.is_owner_of?(bubble) or user.is_moderator_of?(bubble) or channel.kind == 'privy'

      public_channel_count = chat.channels.where(kind: Widgets::ChatWidget::Channel.kinds[:global]).count
      return custom_error('Can not remove all public channels', ctx) unless public_channel_count > 1

      channel_id = channel.id

      if channel.destroy
        # real-time notification
        notify(chat, channel_id)

        {status: true}
      else
        result_if_error_occurred
      end
    end
  end

  def notify(chat, channel_id)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-chatwidget-#{chat.id}",
        event: 'channel_removed',
        data: {
            channel_id: channel_id
        },
        debug_info: {
            location: 'Widgets::Chat::RemoveChatChannelMutation#notify',
            channel_id: channel_id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
