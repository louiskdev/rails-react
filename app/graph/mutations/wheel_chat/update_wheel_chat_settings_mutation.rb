WheelChat::UpdateWheelChatSettingsMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "updateWheelChatSettings"
  description 'update wheelchat settings'

  # Accessible from `input` in the resolve function:
  input_field :channel_name, !types.String
  input_field :mute, !types.Boolean

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :wheel_chat, WheelChat::ChatType

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
      elsif chat.update(wheel_chat_params(inputs))

        {wheel_chat: chat}
      else
        return_errors(chat, ctx)
      end
    end
  end

  def wheel_chat_params(params)
    {
        mute: params[:mute]
    }
  end

  def result_if_error_occurred
    {wheel_chat: nil}
  end

end
