field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'bubble_feed'
  type Connections::ActivitiesWithUnreadCountConnectionType
  description I18n.t('graphql.queries.bubble_feed.description')

  argument :permalink, !types.String, I18n.t('graphql.queries.bubble_feed.args.permalink')
  argument :privacy, types.String, I18n.t('graphql.queries.bubble_feed.args.privacy')
  argument :sort_by, types.String, I18n.t('graphql.queries.bubble_feed.args.sort_by')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      return custom_error('User is unauthorized', ctx)
    elsif !user.completed?
      return custom_error('User has incomplete profile', ctx)
    else
      normalized_args = normalize_input_data(args)
      bubble = Bubble.find_by(permalink: normalized_args[:permalink])
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) if bubble.privy? and !user.is_member_of?(bubble)

      activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
          where(bubble_id: bubble.id, feed: true, shared: false).
          where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND (ignorings.user_id <> :user_id OR (ignorings.location <> \'bubble_feed\' AND ignorings.location <> \'activity\')))',
                model: 'Activity', user_id: user.id)
      activities = activities.where.not(name: ['bubbles.join_user', 'bubbles.disjoin_user']) unless bubble.privy?

      # UNREAD ACTIVITIES FEATURE
      attendance_attrs = {url: "/bubbles/#{bubble.permalink}", section: "bubble_feed"}
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
      get_posts_query_str = "activities.name = 'blogs.create_post'"
      available_privacies = ['public']
      available_privacies << 'friends' if user.is_member_of?(bubble)
      available_privacies << 'private' if user.is_owner_of?(bubble)
      if normalized_args[:privacy].present?
        activities = if available_privacies.include?(normalized_args[:privacy])
                       activities.where("activities.privacy = ? OR #{get_posts_query_str}", Activity.privacies["p_#{normalized_args[:privacy]}"])
                     else
                       activities.none
                     end
      else
        activities = activities.where("activities.privacy IN (?) OR #{get_posts_query_str}", available_privacies.map {|el| Activity.privacies["p_#{el}"]})
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

Feeds::BubbleFeedField = GraphQL::Relay::ConnectionField.create(field)
