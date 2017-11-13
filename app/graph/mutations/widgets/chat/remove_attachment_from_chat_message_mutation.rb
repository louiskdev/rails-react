Widgets::Chat::RemoveAttachmentFromChatMessageMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "removeAttachmentFromChatMessage"
  description I18n.t('graphql.mutations.removeAttachmentFromChatMessage.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.removeAttachmentFromChatMessage.args.id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :message, Widgets::ChatWidget::MessageType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      message = ::Widgets::ChatWidget::Message.find_by(id: inputs[:id])
      return custom_error('Message not found', ctx) if message.nil?

      bubble = message.chat.widget.bubble rescue nil
      if message.user == user or user.can_manage?(bubble)
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
          message.send_changes_notification
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
