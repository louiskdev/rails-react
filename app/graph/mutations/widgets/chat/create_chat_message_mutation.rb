Widgets::Chat::CreateChatMessageMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createChatMessage"
  description I18n.t('graphql.mutations.createChatMessage.description')

  # Accessible from `input` in the resolve function:
  input_field :chat_id, !types.Int, I18n.t('graphql.mutations.createChatMessage.args.chat_id')
  input_field :channel_id, !types.Int, I18n.t('graphql.mutations.createChatMessage.args.channel_id')
  input_field :text, types.String, I18n.t('graphql.mutations.createChatMessage.args.text')
  input_field :picture_file, types.String, I18n.t('graphql.mutations.createChatMessage.args.picture_file')
  input_field :picture_filename, types.String, I18n.t('graphql.mutations.createChatMessage.args.picture_filename')
  input_field :video_id, types.Int, I18n.t('graphql.mutations.createChatMessage.args.video_id')
  input_field :video_url, types.String, I18n.t('graphql.mutations.createChatMessage.args.video_url')
  input_field :link_url, types.String, I18n.t('graphql.mutations.createChatMessage.args.link_url')
  input_field :link_title, types.String, I18n.t('graphql.mutations.createChatMessage.args.link_title')
  input_field :link_description, types.String, I18n.t('graphql.mutations.createChatMessage.args.link_description')
  input_field :link_picture_url, types.String, I18n.t('graphql.mutations.createChatMessage.args.link_picture_url')
  input_field :private, types.Boolean, I18n.t('graphql.mutations.createChatMessage.args.private')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :message, -> { Widgets::ChatWidget::MessageType }

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
      return custom_error('Access denied', ctx) unless user.is_member_of?(bubble)
      channel = chat.channels.find_by(id: inputs[:channel_id])
      return custom_error('Channel not found', ctx) if channel.nil?

      if channel.kind == Widgets::ChatWidget::Channel.kinds[:privy] and channel.channel_members.where(user_id: user.id).count() == 0
        return custom_error('Not authorized to write message into this channel', ctx)
      end

      message = chat.messages.build(user_id: user.id)
      if message.apply_attributes(message_params(normalize_input_data(inputs))).errors.present?
        return_errors(message, ctx)
      elsif message.save
        # Process mentions
        message.process_mentions user.id, bubble

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
        channel_id: inputs[:channel_id],
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
        channel: "private-chatwidget-#{chat.id}",
        event: 'message_created',
        data: {
            message: message.to_hash
        },
        debug_info: {
            location: 'Widgets::Chat::CreateChatMessageMutation#notify!',
            chat_id: chat.id,
            author_id: user.id,
            message: message.to_hash
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {message: nil}
  end

end
