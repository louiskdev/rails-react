field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "findUsers"
  type UserType.connection_type
  description 'Users search by keywords and location.'

  argument :keywords, !types.String.to_list_type
  argument :zip_code, types.String
  argument :radius, types.Int

  resolve -> (obj, args, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      radius = normalized_args[:radius] || 0
      current_user_friend_ids = current_user.friends.ids

      # find interest ids by keywords
      interest_ids = []
      keywords_data = {}  #  keyword_user_id => keyword_interest_id
      no_interest_keywords_count = 0  #  Number of keywords don't match any interest.
      normalized_args[:keywords].each do |keyword|
        keyword_dcase = keyword.downcase.strip
        t_user_ids = User.completed.where("username ILIKE :pattern OR first_name ILIKE :pattern", pattern: "#{keyword_dcase}%").ids
        t_interest_ids = Interest.where("name ILIKE ?", "#{keyword_dcase}%").ids
        return [] if t_user_ids.blank? and t_interest_ids.blank?

        if t_interest_ids.blank?
          no_interest_keywords_count += 1
        else
          interest_ids += t_interest_ids
        end
        return [] if no_interest_keywords_count > 1

        t_user_ids.each do |user_id|
          keywords_data[user_id] = t_interest_ids
        end unless t_user_ids.blank?

        # increment freq field value
        Suggestion.where(keyword: [keyword, keyword_dcase]).each do |suggestion|
          suggestion.update_attribute(:freq, suggestion.freq + 1)
        end
      end

      # find users
      users = []
      already_found_users_ids = []

      # find by username and interests
      keywords_data.each do |user_id, current_interest_ids|
        ids = interest_ids - current_interest_ids
        user_ids_by_interests = UserInterest.select('user_id').where(interest_id: ids).group('user_id').
            having("count(*) = #{ids.size}").pluck(:user_id)

        if ids.empty? || user_ids_by_interests.include?(user_id) && user_id != current_user.id
          user_query = User.distinct.completed.where(id: user_id)
          # user_query = user_query.where.not(id: current_user_friend_ids) # ignore user friends
          if normalized_args[:zip_code].present?
            user_query = radius.positive? ? user_query.near(normalized_args[:zip_code], radius) : user_query.near(normalized_args[:zip_code])
          end

          user = user_query.first
          unless user.nil?
            users << user
            already_found_users_ids << user.id
          end
        end
      end

      # find by interests only
      if no_interest_keywords_count == 0
        user_ids_by_interests = UserInterest.select('user_id').where(interest_id: interest_ids).group('user_id').
            having("count(*) = #{normalized_args[:keywords].size}").pluck(:user_id)
        # ignore current user in query result
        already_found_users_ids << current_user.id
        another_users = User.distinct.completed.where.not('users.id' => already_found_users_ids).where(id: user_ids_by_interests)
        # another_users = another_users.where.not(id: current_user_friend_ids) # ignore user friends
        if normalized_args[:zip_code].present?
          another_users = radius.positive? ? another_users.near(normalized_args[:zip_code], radius) : another_users.near(normalized_args[:zip_code])
        end
        users += another_users
      end

      # users
      result = users.sort { |user| current_user_friend_ids.include?(user.id) ? -1 : 1 }
      result
    end
  end

  def result_if_error_occurred
    []
  end
end

Users::FindUsersField = GraphQL::Relay::ConnectionField.create(field)
