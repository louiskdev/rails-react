Notes::NoteField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "note"
  type !NoteType
  description 'Get note entry by ID'

  argument :id, !types.Int

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      note = Note.find_by(id: args[:id])
      if note.nil?
        add_custom_error('Note not found', ctx)
      else
        note.visits.create(user: user)
        note
      end
    end
  end

  def result_if_error_occurred
    nil
  end
end
