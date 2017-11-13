Comments::DestroyCommentMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyComment"

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) unless user.is_a?(User)

    comment = Comment.find_by(id: inputs[:id])
    return custom_error('Comment not found', ctx) if comment.nil?

    if can_destroy?(user, comment)
      comment.actor = user
      comment.destroy
      {status: comment.destroyed?}
    else
      add_custom_error('Access denied', ctx)
    end
  end

  def can_destroy?(user, comment)
    # user is an author
    return true if user == comment.user

    # user is an owner of commentable object
    object = comment.commentable
    return true if object.respond_to?(:user_id) and object.user_id == user.id

    # commentable object belongs to bubble and user can manage it
    bubble = case object.class.name
               when 'Medium', 'Album' then object.gallery.try(:bubble)
               when 'Widgets::BlogWidget::Post' then object.blog.try(:bubble)
               else
                 nil
             end

    user.can_manage?(bubble)
  end

  def result_if_error_occurred
    {status: false}
  end

end
