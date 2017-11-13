WheelChat::RemoveAttachmentFromWheelChatMessageMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "removeAttachmentFromWheelChatMessage"
  description "remove attachment from wheelchat message if more then 24 hrs didn't expire since the message had been created"

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :message, WheelChat::MessageType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      message = ::WheelChat::Message.find_by(id: inputs[:id])
      if message.nil?
        add_custom_error('Message not found', ctx)
      elsif message.user == user
        if message.media.present? and message.created_at > 24.hours.ago
          message.media.destroy_all
        end
        # remove empty message
        if message.text.blank? and message.video_url.blank? and message.media.blank?
          message.destroy
        end

        if message.destroyed?
          {message: nil}
        else
          {message: message}
        end
      else
        add_custom_error('Access denied', ctx)
      end
    end
  end

  def result_if_error_occurred
    {message: nil}
  end

end
