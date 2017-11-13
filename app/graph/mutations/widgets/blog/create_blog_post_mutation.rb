Widgets::Blog::CreateBlogPostMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createBlogPost"
  description I18n.t('graphql.mutations.createBlogPost.description')

  # Accessible from `input` in the resolve function:
  input_field :blog_id, !types.Int, I18n.t('graphql.mutations.createBlogPost.args.blog_id')
  input_field :title, types.String, I18n.t('graphql.mutations.createBlogPost.args.title')
  input_field :text, types.String, I18n.t('graphql.mutations.createBlogPost.args.text')
  input_field :picture_files, types[types.String], I18n.t('graphql.mutations.createBlogPost.args.picture_files')
  input_field :picture_filename, types.String, I18n.t('graphql.mutations.createBlogPost.args.picture_filename')
  input_field :video_id, types.Int, I18n.t('graphql.mutations.createBlogPost.args.video_id')
  input_field :link_url, types.String, I18n.t('graphql.mutations.createBlogPost.args.link_url')
  input_field :link_title, types.String, I18n.t('graphql.mutations.createBlogPost.args.link_title')
  input_field :link_description, types.String, I18n.t('graphql.mutations.createBlogPost.args.link_description')
  input_field :link_picture_url, types.String, I18n.t('graphql.mutations.createBlogPost.args.link_picture_url')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :activity, ActivityType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      blog = ::Widgets::BlogWidget::Blog.find_by(id: inputs[:blog_id])
      return custom_error('Blog not found', ctx) if blog.nil?

      bubble = blog.bubble
      return custom_error('Associated bubble not found', ctx) if bubble.nil?

      bm = user.bubble_members.where(bubble_id: bubble.id).first
      return custom_error('Access denied', ctx) if bm.nil?

      normalized_inputs = normalize_input_data(inputs)
      post = blog.posts.build(user_id: user.id)
      if post.apply_post_attributes(post_params(normalized_inputs)).errors.present?
        return_errors(post, ctx)
      elsif post.save
        # Process mentions
        post.process_mentions user.id, bubble

        activity = post.activities.find_by(name: 'blogs.create_post')

        # Process hashtags
        if not bubble.privy?
          hashtags = post.process_hashtags activity.id
          notify_hashtag_activity_added activity, hashtags
        end

        {activity: activity}
      else
        return_errors(post, ctx)
      end
    end
  end

  def post_params(params)
    {
        text: params[:text],
        title: params[:title],
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

  def notify_hashtag_activity_added(activity, hashtags)
    json = ApplicationController.new.render_to_string(partial: 'api/v1/users/feed', locals: { activities: [activity], feed_type: 'hashtag', unread_activities_count: 0 })
    new_activity_data = JSON.parse json

    # real-time notification
    # Pusher.trigger("private-bubble-#{bubble.permalink}", 'member_joined', member: new_user_data)
    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'hashtag_added',
        data: {
            hashtags: hashtags,
            activity: new_activity_data
        },
        debug_info: {
            location: 'HashtagActivity#notify_hashtag_activity_added',
            new_activity_id: activity.id,
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
