Widgets::Files::DeleteFileMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "deleteFile"
  description I18n.t('graphql.mutations.deleteFile.description')

  # Accessible from `input` in the resolve function:
  input_field :file_id, !types.Int, I18n.t('graphql.mutations.deleteFile.args.file_id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.blank?

    file = UploadedFile.find(inputs[:file_id])
    return custom_error('File not found', ctx) if file.blank?

    bubble = file.bubble
    return custom_error('Not authorized to delete this file', ctx) unless !bubble.privy? or user.is_member_of?(bubble)

    file_id = file.id

    if file.delete
      notify bubble, file_id
      {status: true}
    else
      return custom_error('Failed to save delete file', ctx)
    end
  end

  def result_if_error_occurred
    {status: false}
  end

  def notify(bubble, file_id)
    ws_msg = {
      adapter: 'pusher',
      channel: "private-bubble-#{bubble.permalink}",
      event: 'file_deleted',
      data: {
        file_id: file_id,
        bubble_id: bubble.id,
      },
      debug_info: {
        location: 'Widgets::Files::DeleteFileMutation',
        channel: "private-bubble-#{bubble.permalink}",
        event: 'file_deleted',
        file_id: file_id,
        bubble_id: bubble.id,
      }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
