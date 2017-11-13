Documents::DocumentField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name 'document'
  type SharedDocType
  description I18n.t('graphql.queries.document.description')

  argument :document_id, !types.ID, I18n.t('graphql.queries.document.args.id')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      doc = SharedDoc.find args[:document_id]
      return custom_error('Document not found', ctx) if doc.nil?

      bubble = doc.bubble
      return custom_error('Access denied', ctx) if bubble.privy? and !user.is_member_of?(bubble)

      doc
    end
  end

  def result_if_error_occurred
    nil
  end

end
