Notes::UpdateNoteMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "updateNote"
  description 'update text content of note entry'

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int
  input_field :text, !types.String
  input_field :link_url, types.String
  input_field :link_title, types.String
  input_field :link_description, types.String
  input_field :link_picture_url, types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :note, NoteType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      note = user.notes.find_by(id: normalized_inputs[:id])
      if note.nil?
        add_custom_error('Note not found', ctx)
      else
        if note.apply_post_attributes(post_params(normalized_inputs)).errors.present?
          return_errors(note, ctx)
        elsif note.save
          {note: note}
        else
          return_errors(note, ctx)
        end
      end
    end
  }

  def post_params(params)
    {
        text: params[:text],
        link_url: params[:link_url],
        link_title: params[:link_title],
        link_description: params[:link_description],
        link_picture_url: params[:link_picture_url]
    }
  end

  def result_if_error_occurred
    {note: nil}
  end

end
