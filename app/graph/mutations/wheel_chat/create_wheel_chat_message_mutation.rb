WheelChat::CreateWheelChatMessageMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createWheelChatMessage"
  description 'send new message to wheelchat'

  # Accessible from `input` in the resolve function:
  input_field :private, types.Boolean
  input_field :channel_name, !types.String
  input_field :text, types.String
  input_field :picture_file, types.String
  input_field :picture_filename, types.String
  input_field :video_id, types.Int
  input_field :video_url, types.String
  input_field :link_url, types.String
  input_field :link_title, types.String
  input_field :link_description, types.String
  input_field :link_picture_url, types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :message, WheelChat::MessageType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      # check channel name
      channel_name = normalized_inputs[:channel_name]
      user_ids = channel_name.split('_')
      begin
        raise ArgumentError if Integer(user_ids[0]) >= Integer(user_ids[1])
      rescue ArgumentError => ae
        return add_custom_error('Channel name is invalid', ctx)
      end

      chat = ::WheelChat::Chat.find_or_create_by(channel_name: channel_name)
      receiver_id = chat.user_ids.reject { |el| el == user.id }.first # get receiver ID
      message = chat.messages.build(user_id: user.id, receiver_id: receiver_id)
      if message.apply_attributes(message_params(normalized_inputs)).errors.present?
        return_errors(message, ctx)
      elsif message.save
        ::WheelChat::Notification.create(initiator_id: user.id, user_id: receiver_id, channel_name: channel_name)

        # real-time notification
        notify!(user, chat, message)

        {message: message}
      else
        return_errors(message, ctx)
      end
    end
  end

  def message_params(inputs)
    {
        text: inputs[:text],
        video_url: inputs[:video_id],
        picture_file: inputs[:picture_file],
        picture_filename: inputs[:picture_filename],
        video_id: inputs[:video_id],
        link_url: inputs[:link_url],
        link_title: inputs[:link_title],
        link_description: inputs[:link_description],
        link_picture_url: inputs[:link_picture_url]
    }
  end

  def notify!(user, chat, message)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-messages_#{chat.channel_name}",
        event: 'new_1v1_message',
        data: {
            message: message.to_hash
        },
        debug_info: {
            location: 'WheelChat::CreateWheelChatMessageMutation#notify!',
            chat_id: chat.id,
            author_id: user.id,
            receiver_id: message.receiver_id,
            message: message.to_hash
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {message: nil}
  end

end
