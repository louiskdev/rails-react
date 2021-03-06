field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "uploadedFiles"
  type UploadedFileType.connection_type
  description I18n.t('graphql.queries.uploadedFiles.description')

  argument :bubble_id, !types.Int, I18n.t('graphql.queries.uploadedFiles.args.bubble_id')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      bubble = Bubble.find(args[:bubble_id])
      return custom_error('Bubble not found', ctx) if bubble.nil?

      if bubble.privy? and !user.is_member_of?(bubble)
        return custom_error('Access denied', ctx)
      else
        query = UploadedFile.where(bubble_id: args[:bubble_id])

        query = query.order(created_at: :desc)
        query
      end

    end
  end

  def result_if_error_occurred
    []
  end

end

Widgets::Files::UploadedFilesField = GraphQL::Relay::ConnectionField.create(field)
