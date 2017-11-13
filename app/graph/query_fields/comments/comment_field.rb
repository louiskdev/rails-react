Comments::CommentField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "comment"
  type CommentType
  description 'Get comment entry by ID'

  argument :id, !types.Int

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      comment = Comment.find_by(id: args[:id])
      if comment.nil?
        add_custom_error('Comment not found', ctx)
      elsif user.can_view?(comment)
        comment
      else
        add_custom_error('Comment not found', ctx)
      end
    end
  end

  def result_if_error_occurred
    nil
  end

end
