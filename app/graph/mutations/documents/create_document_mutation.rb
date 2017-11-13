Documents::CreateDocumentMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "createDocument"
  description "Create shared document"

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int
  input_field :title, !types.String
  input_field :document, !types.String

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean
  return_field :document_id, !types.Int

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      bubble = Bubble.find inputs[:bubble_id]
      return custom_error('Invalid bubble id', ctx) unless bubble.present?

      member = bubble.members.find user.id
      return custom_error('Current user is not member of this bubble', ctx) if member.nil?

      doc_obj = Document.new(content: JSON.parse(inputs[:document]))
      if doc_obj.save
        doc_record = SharedDoc.new(
          owner_id: user.id,
          bubble_id: bubble.id,
          title: inputs[:title],
          doc_id_external: doc_obj.id
        )
        if doc_record.save
          notify_created user, bubble, doc_record
          return {status: true, document_id: doc_record.id}
        else
          doc_obj.delete
        end
      end
      result_if_error_occurred
    end
  end

  def result_if_error_occurred
    {status: false, document_id: 0}
  end

  def notify_created(current_user, bubble, document)
    ws_msg = {
      adapter: 'pusher',
      channel: "private-bubble-#{bubble.permalink}",
      event: 'document_created',
      data: {
        id: document.id,
        owner_id: document.owner_id,
        bubble_id: bubble.id,
        title: document.title,
        content: document.content,
        created_at: document.created_at.to_s,
        updated_at: document.updated_at.to_s,
        owner: {
          id: current_user.id,
          username: current_user.username,
          avatar_url: current_user.avatar_url,
        },
        bubble: {
          id: bubble.id,
          permalink: bubble.permalink,
          name: bubble.name,
          avatar_url: bubble.avatar_url,
        }
      },
      debug_info: {
        location: 'Documents::CreateDocumentMutation',
        user_id: current_user.id,
        channel: "private-bubble-#{bubble.permalink}",
        event: 'document_created',
        id: document.id,
        owner_id: document.owner_id,
        bubble_id: bubble.id
      }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
