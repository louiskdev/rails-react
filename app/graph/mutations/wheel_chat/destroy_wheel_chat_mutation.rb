WheelChat::DestroyWheelChatMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyWheelChat"
  description 'clear wheelchat data'

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
        chat.destroy
        if chat.destroyed?
          {status: true}
        else
          result_if_error_occurred
        end
      end
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
