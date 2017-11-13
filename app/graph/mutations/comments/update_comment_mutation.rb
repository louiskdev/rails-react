Comments::UpdateCommentMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "updateComment"

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int
  input_field :text, types.String
  input_field :picture_file, types.String
  input_field :picture_filename, types.String
  input_field :video_id, types.Int
  input_field :link_url, types.String
  input_field :link_title, types.String
  input_field :link_description, types.String
  input_field :link_picture_url, types.String

  # resolve must return a hash with these keys
  return_field :comment, CommentType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) unless user.is_a?(User)

    comment = Comment.find_by(id: inputs[:id])
    return custom_error('Comment not found', ctx) if comment.nil?
    return custom_error('Access denied', ctx) unless can_update?(user, comment)

    normalized_inputs = normalize_input_data(inputs)

    comment.actor = user
    if comment.apply_attributes(comment_params(normalized_inputs)).errors.present?
      return_errors(comment, ctx)
    elsif comment.save
      notify!(comment)

      # Process mentions
      comment.process_mentions(user.id)

      {comment: comment}
    else
      return_errors(comment, ctx)
    end

  }

  def comment_params(params)
    {
        text: params[:text],
        picture_file: params[:picture_file],
        picture_filename: params[:picture_filename],
        video_id: params[:video_id],
        link_url: params[:link_url],
        link_title: params[:link_title],
        link_description: params[:link_description],
        link_picture_url: params[:link_picture_url]
    }
  end

  def can_update?(user, comment)
    # user is an author
    user == comment.user
  end

  def notify!(comment)
    object = comment.commentable

    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'comment_updated',
        data: {
            message: {
                comment_id: comment.id,
                object_type: object.class.name,
                object_id: object.id
            }
        },
        debug_info: {
            location: 'Comments::UpdateCommentMutation#notify!',
            object_type: object.class.name,
            object_id: object.id,
            user_id: comment.actor.try(:id)
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {comment: nil}
  end
end
