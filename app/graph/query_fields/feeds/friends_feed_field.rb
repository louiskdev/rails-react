field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'friends_feed'
  type Connections::ActivitiesWithUnreadCountConnectionType
  description I18n.t('graphql.queries.friends_feed.description')

  argument :privacy, types.String, I18n.t('graphql.queries.friends_feed.args.privacy')
  argument :sort_by, types.String, I18n.t('graphql.queries.friends_feed.args.sort_by')
  argument :touch, types.Boolean, I18n.t('graphql.queries.friends_feed.args.touch'), default_value: true

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      return add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      activities = Activity.friends_feed_activities(user)

      # UNREAD ACTIVITIES FEATURE
      attendance_attrs = {url: "/dashboard", section: "friends_feed"}
      attendance = user.attendances.find_by(attendance_attrs)

      if attendance.nil?
        date = DateTime.ordinal(0)
        user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now)) if normalized_args[:touch]
      else
        date = attendance.latest_date
        attendance.update(latest_date: DateTime.now) if normalized_args[:touch]
      end

      ctx[:unread_activities_count] = activities.where('activities.created_at > ?', date).count
      # UNREAD ACTIVITIES FEATURE

      # apply 'privacy' arg
      activities = case normalized_args[:privacy]
                     when 'private' then activities.p_private
                     when 'public' then activities.where(privacy: [Activity.privacies[:p_public], Activity.privacies[:p_friends]])
                     else
                       activities
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
      end

      # TODO mark records as viewed
      if normalized_args[:touch]
        limit = normalized_args[:first] || normalized_args[:last] || 0
        current_activities = activities.is_a?(Array) ? activities.first(limit) : activities.limit(limit)
        current_activities.each do |activity|
          activity.object.visits.create(user: user) rescue nil
        end
      end

      activities
    end
  end

  def result_if_error_occurred
    []
  end

end

Feeds::FriendsFeedField = GraphQL::Relay::ConnectionField.create(field)
