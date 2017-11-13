Widgets::Files::CountDownloadMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "countDownload"
  description I18n.t('graphql.mutations.countDownload.description')

  # Accessible from `input` in the resolve function:
  input_field :file_id, !types.Int, I18n.t('graphql.mutations.countDownload.args.file_id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.blank?
    
    file = UploadedFile.find(inputs[:file_id])
    return custom_error('File not found', ctx) if file.blank?

    if file.increment!(:downloads)
      {status: true}
    else
      return custom_error('Failed to save download count', ctx)
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
