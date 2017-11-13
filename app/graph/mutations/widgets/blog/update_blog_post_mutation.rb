Widgets::Blog::UpdateBlogPostMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "updateBlogPost"
  description I18n.t('graphql.mutations.updateBlogPost.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.updateBlogPost.args.id')
  input_field :title, types.String, I18n.t('graphql.mutations.updateBlogPost.args.title')
  input_field :text, types.String, I18n.t('graphql.mutations.updateBlogPost.args.text')
  input_field :link_url, types.String, I18n.t('graphql.mutations.updateBlogPost.args.link_url')
  input_field :link_title, types.String, I18n.t('graphql.mutations.updateBlogPost.args.link_title')
  input_field :link_description, types.String, I18n.t('graphql.mutations.updateBlogPost.args.link_description')
  input_field :link_picture_url, types.String, I18n.t('graphql.mutations.updateBlogPost.args.link_picture_url')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :activity, ActivityType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      post = Widgets::BlogWidget::Post.find_by(id: inputs[:id])
      return custom_error('Post not found', ctx) if post.nil?

      if post.user_id == user.id
        update_post(post, inputs, user)
      else
        bubble = post.blog.bubble rescue nil
        return custom_error('Access denied', ctx) if bubble.nil?
        return custom_error('Access denied', ctx) unless user.can_manage?(bubble)

        update_post(post, normalize_input_data(inputs), user)
      end
    end
  }

  def post_params(params)
    {
        title: params[:title],
        text: params[:text],
        link_url: params[:link_url],
        link_title: params[:link_title],
        link_description: params[:link_description],
        link_picture_url: params[:link_picture_url]
    }
  end

  def update_post(post, inputs, user)
    if post.apply_post_attributes(post_params(inputs)).errors.present?
      return_errors(post, ctx)
    else
      post.actor = user
      if post.save
        activity = post.activities.where(name: 'blogs.update_post').first
        {activity: activity}
      else
        return_errors(post, ctx)
      end
    end
  end

  def result_if_error_occurred
    {activity: nil}
  end

end
