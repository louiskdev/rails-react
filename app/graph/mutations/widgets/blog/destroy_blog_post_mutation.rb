Widgets::Blog::DestroyBlogPostMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyBlogPost"
  description I18n.t('graphql.mutations.destroyBlogPost.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.destroyBlogPost.args.id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      post = Widgets::BlogWidget::Post.find_by(id: inputs[:id])
      return custom_error('Post not found', ctx) if post.nil?

      if post.user_id == user.id
        destroy_post(post, user)
      else
        bubble = post.blog.bubble rescue nil
        if user.can_manage?(bubble)
          destroy_post(post, user)
        else
          add_custom_error('Access denied', ctx)
        end
      end

    end
  }

  def destroy_post(post, user)
    post.actor = user
    post.destroy
    status = post.destroyed?
    {status: status}
  end

  def result_if_error_occurred
    {status: false}
  end

end
