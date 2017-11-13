field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "suggestUsers"
  type UserType.connection_type
  description 'Suggest users by username or first name.'

  argument :keyword, !types.String

  resolve -> (obj, args, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      users = User.distinct.completed.
          where("first_name ILIKE :word OR username ILIKE :word", word: "%#{args[:keyword]}%").
          where.not(id: current_user.id)

      current_user_friend_ids = current_user.friends.ids
      result = users.sort { |user| current_user_friend_ids.include?(user.id) ? -1 : 1 }
      result
    end
  end

  def result_if_error_occurred
    []
  end
end

Users::SuggestUsersField = GraphQL::Relay::ConnectionField.create(field)
