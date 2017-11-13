WheelChat::ClearWheelChatNotificationsMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "clearWheelChatNotifications"
  description 'clear missed message notifications in this wheelchat'

  # Accessible from `input` in the resolve function:
  input_field :channel_name, !types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      # check channel name
      channel_name = inputs[:channel_name]
      user_ids = channel_name.split('_')
      begin
        raise ArgumentError if Integer(user_ids[0]) >= Integer(user_ids[1])
      rescue ArgumentError => ae
        return add_custom_error('Channel name is invalid', ctx)
      end

      chat = ::WheelChat::Chat.find_by(channel_name: channel_name)
      if chat.nil?
        add_custom_error('Chat not found', ctx)
      else
        ::WheelChat::Notification.destroy_all(channel_name: chat.channel_name)

        # real-time notification
        notify!(user, chat)

        {status: true}
      end
    end
  end

  def notify!(user, chat)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-messages_#{chat.channel_name}",
        event: 'notifications_removed',
        data: {
            message: {
                notifications: []
            }
        },
        debug_info: {
            location: 'WheelChat::ClearWheelChatNotificationsMutation#notify!',
            chat_id: chat.id,
            user_id: user.id,
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
