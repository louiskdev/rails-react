Documents::UpdateDocumentMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "updateDocument"
  description "Update shared document"

  # Accessible from `input` in the resolve function:
  input_field :document_id, !types.Int
  input_field :title, types.String
  input_field :updateData, !types.String

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
      # return custom_error('User is not allowed to update this document', ctx) unless user.id == doc.owner_id

      doc_obj = Document.find(doc.doc_id_external)
      return custom_error('Document content record not found', ctx) unless doc_obj.present?

      content = JSON.parse(doc_obj.content.to_json)
      blocks = content['blocks']
      updateData = JSON.parse(inputs[:updateData])

      # now update content blocks with updateData
      if updateData['deleteAfter'] >= 0
        blocks = blocks[0, updateData['deleteAfter']]
      end
      inserted = 0
      updateData['diffs'].each { |diff|
        insertPos = diff['after'] + inserted + 1
        blocks[insertPos, 0] = diff['blocks']
        inserted += diff['blocks'].length
      }

      content['blocks'] = blocks
      doc_obj.content = content
      if doc_obj.save
        if doc.title != inputs[:title]
          doc.title = inputs[:title]
          doc.save

          bubble = doc.bubble
          ws_msg1 = {
            adapter: 'pusher',
            channel: "private-bubble-#{bubble.permalink}",
            event: 'document_updated',
            data: {
              id: doc.id,
              title: doc.title,
              updated_at: doc.updated_at.to_s,
            },
            debug_info: {
              location: 'Documents::UpdateDocumentMutation',
              document_id: doc.id,
              title: doc.title,
              updated_at: doc.updated_at.to_s,
            }
          }
          RealTimeNotificationJob.perform_later(ws_msg1)
        end

        ws_msg = {
          adapter: 'pusher',
          channel: "private-document-#{doc.id}",
          event: 'update',
          data: {
            updaterId: user.id,
            title: inputs[:title],
            updateData: inputs[:updateData],
          },
          debug_info: {
            location: 'Documents::UpdateDocumentMutation',
            document_id: doc.id,
            updaterId: user.id,
            title: inputs[:title],
            updateData: inputs[:updateData],
          }
        }
        RealTimeNotificationJob.perform_later(ws_msg)

        {status: true}
      else
        result_if_error_occurred
      end
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
