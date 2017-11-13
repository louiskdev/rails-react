Notes::DestroyNoteMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyNote"
  description 'destroy note entry'

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      note = user.notes.find_by(id: inputs[:id])
      if note.nil?
        add_custom_error('Note not found', ctx)
      else
        note.destroy
        status = note.destroyed?
        {status: status}
      end
    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
