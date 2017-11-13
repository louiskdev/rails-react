Notes::CreateNoteMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createNote"
  description 'create new note entry'

  # Accessible from `input` in the resolve function:
  input_field :text, types.String
  input_field :private, !types.Boolean
  input_field :picture_files, types[types.String]
  input_field :picture_filename, types.String
  input_field :video_id, types.Int
  input_field :link_url, types.String
  input_field :link_title, types.String
  input_field :link_description, types.String
  input_field :link_picture_url, types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :activity, ActivityType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      note = user.notes.build(private: normalized_inputs[:private])
      if note.apply_post_attributes(post_params(normalized_inputs)).errors.present?
        return_errors(note, ctx)
      elsif note.save
        # Process mentions
        note.process_mentions user.id

        activity = note.activities.find_by(name: 'notes.create')
        {activity: activity}
      else
        return_errors(note, ctx)
      end
    end
  }

  def post_params(params)
    {
        text: params[:text],
        picture_files: params[:picture_files],
        picture_filename: params[:picture_filename],
        video_id: params[:video_id],
        link_url: params[:link_url],
        link_title: params[:link_title],
        link_description: params[:link_description],
        link_picture_url: params[:link_picture_url]
    }
  end

  def result_if_error_occurred
    {activity: nil}
  end

end
