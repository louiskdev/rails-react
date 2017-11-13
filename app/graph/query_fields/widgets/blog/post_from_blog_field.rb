Widgets::Blog::PostFromBlogField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name 'postFromBlog'
  type ActivityType
  description I18n.t('graphql.queries.postFromBlog.description')

  argument :id, !types.Int, I18n.t('graphql.queries.postFromBlog.args.id')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      post = Widgets::BlogWidget::Post.find_by(id: args[:id])
      return custom_error('Post not found', ctx) if post.nil?

      activity = post.activities.find_by(name: 'blogs.create_post')
      bubble = post.blog.bubble

      unless user.is_member_of?(bubble)
        return custom_error('Access denied', ctx) if bubble.privy? or !activity.p_public?
      end

      activity.object.visits.create(user: user) rescue nil
      activity
    end
  end

  def result_if_error_occurred
    nil
  end

end
