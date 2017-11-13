field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'my_feed_mobile'
  type ActivityType.connection_type
  description I18n.t('graphql.queries.my_feed.description')

  argument :privacy, types.String, I18n.t('graphql.queries.my_feed.args.privacy')
  argument :sort_by, types.String, I18n.t('graphql.queries.my_feed.args.sort_by')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      return add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
          where(user_id: user.id, feed: true).
          where("object_type = 'Note' OR shared = true").
          where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND (ignorings.user_id <> :user_id OR (ignorings.location <> \'my_feed\' AND ignorings.location <> \'activity\')))',
                model: 'Activity', user_id: user.id)

      # apply 'privacy' arg
      if normalized_args[:privacy].present?
        if normalized_args[:privacy] == 'private'
          activities = activities.p_private
        elsif normalized_args[:privacy] == 'public'
          activities = activities.where('activities.privacy IN (?)', [Activity.privacies[:p_public], Activity.privacies[:p_friends]])
        end
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

      activities
    end
  end

  def result_if_error_occurred
    []
  end

end

Feeds::MyFeedMobileField = GraphQL::Relay::ConnectionField.create(field)
