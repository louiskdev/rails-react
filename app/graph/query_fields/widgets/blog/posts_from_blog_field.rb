field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'postsFromBlog'
  type Connections::ActivitiesWithUnreadCountConnectionType
  description I18n.t('graphql.queries.postsFromBlog.description')

  argument :blog_id, !types.Int, I18n.t('graphql.queries.postsFromBlog.args.blog_id')
  argument :privacy, types.String, I18n.t('graphql.queries.postsFromBlog.args.privacy')
  argument :sort_by, types.String, I18n.t('graphql.queries.postsFromBlog.args.sort_by')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      blog = Widgets::BlogWidget::Blog.find_by(id: normalized_args[:blog_id])
      return custom_error('Blog not found', ctx) if blog.nil?

      bubble = blog.bubble
      post_ids = blog.posts.ids
      activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
          where(feed: true, object_type: 'Widgets::BlogWidget::Post', object_id: post_ids).
          where(shared: false).
          where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND (ignorings.user_id <> :user_id OR (ignorings.location <> \'blog_feed\' AND ignorings.location <> \'activity\')))',
                model: 'Activity', user_id: user.id)

      # UNREAD ACTIVITIES FEATURE
      attendance_attrs = {url: "/bubbles/#{bubble.permalink}", section: "bubble_blog"}
      attendance = user.attendances.find_by(attendance_attrs)

      if attendance.nil?
        date = DateTime.ordinal(0)
        user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now))
      else
        date = attendance.latest_date
        attendance.update(latest_date: DateTime.now)
      end

      ctx[:unread_activities_count] = activities.where('activities.created_at > ?', date).count
      # UNREAD ACTIVITIES FEATURE

      # apply 'privacy' arg
      if user.is_member_of?(bubble)
        if normalized_args[:privacy].present? and ['private', 'friends', 'public'].include?(normalized_args[:privacy])
          activities = activities.where('activities.privacy = ?', Activity.privacies["p_#{normalized_args[:privacy]}"])
        end
      elsif bubble.privy?
        return custom_error('Access denied', ctx)
      elsif normalized_args[:privacy].blank? or normalized_args[:privacy] == 'public'
        activities = activities.where('activities.privacy = ?', Activity.privacies["p_public"])
      else
        return custom_error('Access denied', ctx)
      end

      # apply 'sort_by' arg
      if activities.present?
        activities = case normalized_args[:sort_by]
                       when 'rating' then activities.to_a.sort_by! {|a| [(a.object.rating rescue 0), a.created_at] }.reverse!
                       when 'newest' then activities.order(created_at: :desc)
                       when 'favorite' then activities.joins(:favorite_activities).where("favorite_activities.user_id = ?", user.id)
                     else
                       activities.order(created_at: :desc)
                     end

        # TODO mark records as viewed
        limit = normalized_args[:first] || normalized_args[:last] || 0
        current_activities = activities.is_a?(Array) ? activities.first(limit) : activities.limit(limit)
        current_activities.each do |activity|
          activity.object.visits.create(user: user) rescue nil
        end
      end
      # send realtime notification
      user.notify_unread_items_count_changed(bubble)

      activities
    end
  end

  def result_if_error_occurred
    []
  end

end

Widgets::Blog::PostsFromBlogField = GraphQL::Relay::ConnectionField.create(field)
