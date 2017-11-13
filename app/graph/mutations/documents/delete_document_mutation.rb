Documents::DeleteDocumentMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "deleteDocument"
  description "Delete shared document"

  # Accessible from `input` in the resolve function:
  input_field :document_id, !types.Int

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      doc = SharedDoc.find(inputs[:document_id])
      return custom_error('Document not found', ctx) unless doc.present?

      doc_obj = Document.find(doc.doc_id_external)
      return custom_error('Document content record not found', ctx) unless doc_obj.present?

      bubble = doc.bubble
      return custom_error('Not authorized to delete this document', ctx) unless user.is_owner_of?(bubble) or user.is_moderator_of?(bubble)

      document_id = doc.id

      doc_obj.delete
      doc.delete

      notify bubble, document_id

      {status: true}
    end
  end

  def result_if_error_occurred
    {status: false}
  end

  def notify(bubble, document_id)
    ws_msg = {
      adapter: 'pusher',
      channel: "private-bubble-#{bubble.permalink}",
      event: 'document_deleted',
      data: {
        document_id: document_id,
        bubble_id: bubble.id,
      },
      debug_info: {
        location: 'Documents::DeleteDocumentMutation',
        channel: "private-bubble-#{bubble.permalink}",
        event: 'document_deleted',
        document_id: document_id,
        bubble_id: bubble.id,
      }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
