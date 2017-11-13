Widgets::Chat::AddUserToPrivateChannelMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "addUserToPrivateChannel"
  description I18n.t('graphql.mutations.addUserToPrivateChannel.description')

  # Accessible from `input` in the resolve function:
  input_field :channel_id, !types.Int, I18n.t('graphql.mutations.addUserToPrivateChannel.args.chat_id')
  input_field :user_id, !types.Int, I18n.t('graphql.mutations.addUserToPrivateChannel.args.user_id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      user = User.find(inputs[:user_id])
      return custom_error('User not found', ctx) if user.nil?

      channel = Widgets::ChatWidget::Channel.find_by(id: inputs[:channel_id])
      return custom_error('Channel not found', ctx) if channel.nil?
      return custom_error('Invalid channel type', ctx) unless channel.kind == 'privy'

      chat = channel.chat
      bubble = chat.widget.try(:bubble)
      return custom_error('Bubble not found', ctx) if bubble.nil?

      channel_member = channel.channel_members.where(user_id: user.id).first
      if channel_member
        return custom_error('Already joined this channel', ctx)
      end
      channel_member = channel.channel_members.build(user_id: user.id)
      if channel_member.save

        notify!(chat, channel, user.id, current_user)

        {status: true}
      else
        result_if_error_occurred
      end
    end
  end

  def notify!(chat, channel, user_id, current_user)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-chatwidget-#{chat.id}",
        event: 'invited_to_channel',
        data: {
            channel: channel.to_hash(current_user),
            user_id: user_id,
        },
        debug_info: {
            location: 'Widgets::Chat::AddUserToPrivateChannelMutation#notify!',
            channel: channel.to_hash(current_user),
            user_id: user_id,
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
