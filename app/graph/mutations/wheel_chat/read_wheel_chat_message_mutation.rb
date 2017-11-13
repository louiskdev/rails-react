WheelChat::ReadWheelChatMessageMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "readWheelChatMessage"
  description I18n.t('graphql.mutations.readWheelChatMessage.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.readWheelChatMessage.args.id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :message, WheelChat::MessageType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.blank?

    message = ::WheelChat::Message.find_by(id: inputs[:id])
    return custom_error('Message not found', ctx) if message.blank?
    return custom_error('Access denied', ctx) if user.id != message.receiver_id

    if message.read_at.blank? and message.touch(:read_at)
      message.reload
    end

    {message: message}
  end

  def result_if_error_occurred
    {message: nil}
  end

end
