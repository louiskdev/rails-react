Widgets::Chat::RenameChatChannelMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "renameChatChannel"
  description I18n.t('graphql.mutations.renameChatChannel.description')

  # Accessible from `input` in the resolve function:
  input_field :channel_id, !types.Int, I18n.t('graphql.mutations.renameChatChannel.args.channel_id')
  input_field :new_name, !types.String, I18n.t('graphql.mutations.renameChatChannel.args.name')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    return custom_error('Cannot rename to empty name', ctx) if inputs[:new_name].blank?

    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      channel = Widgets::ChatWidget::Channel.find_by(id: inputs[:channel_id])
      return custom_error('Chat widget channel not found', ctx) if channel.nil?

      chat = channel.chat
      bubble = chat.widget.try(:bubble)
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) unless user.is_owner_of?(bubble) or user.is_moderator_of?(bubble)

      channel.name = inputs[:new_name]
      if channel.save
        # real-time notification
        notify!(chat, channel, user)

        {status: true}
      else
        result_if_error_occurred
      end
    end
  end

  def notify!(chat, channel, current_user)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-chatwidget-#{chat.id}",
        event: 'channel_renamed',
        data: {
            channel: channel.to_hash(current_user)
        },
        debug_info: {
            location: 'Widgets::Chat::renameChatChannelMutation#notify!',
            chat_id: chat.id,
            channel: channel.to_hash(current_user)
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
