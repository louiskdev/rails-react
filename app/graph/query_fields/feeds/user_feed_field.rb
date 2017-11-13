field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'user_feed'
  type ActivityType.connection_type
  description I18n.t('graphql.queries.user_feed.description')

  argument :username, !types.String, I18n.t('graphql.queries.user_feed.args.username')
  argument :sort_by, types.String, I18n.t('graphql.queries.user_feed.args.sort_by')

  resolve -> (obj, args, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      user = User.find_by(username: normalized_args[:username])
      if user.nil?
        return add_custom_error('User not found', ctx)
      elsif user.id == current_user.id
        activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
            where(user_id: user.id, feed: true).
            where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND (ignorings.user_id <> :user_id OR (ignorings.location <> \'user_feed\' AND ignorings.location <> \'activity\')))',
                  model: 'Activity', user_id: user.id)
      elsif current_user.friend_of?(user)
        activities = user.activities.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
            where(feed: true, privacy: [Activity.privacies[:p_friends], Activity.privacies[:p_public]]).
            where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND (ignorings.user_id <> :user_id OR (ignorings.location <> \'user_feed\' AND ignorings.location <> \'activity\')))',
                  model: 'Activity', user_id: current_user.id)
      else
        return add_custom_error('Access denied', ctx)
      end

      if activities.present?
        # apply 'sort_by' arg
        if activities.present?
          activities = case normalized_args[:sort_by]
                         when 'rating' then activities.to_a.sort_by! {|a| [(a.object.rating rescue 0), a.created_at] }.reverse!
                         when 'newest' then activities.order(created_at: :desc)
                         else
                           activities.order(created_at: :desc)
                       end
        end

        # TODO mark records as viewed
        limit = normalized_args[:first] || normalized_args[:last] || 0
        current_activities = activities.is_a?(Array) ? activities.first(limit) : activities.limit(limit)
        current_activities.each do |activity|
          activity.object.visits.create(user: current_user) rescue nil
        end
      end

      activities
    end
  end

  def result_if_error_occurred
    []
  end

end

Feeds::UserFeedField = GraphQL::Relay::ConnectionField.create(field)
