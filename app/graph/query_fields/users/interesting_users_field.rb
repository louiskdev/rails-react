field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "interesting_users"
  type UserType.connection_type
  description 'Get interesting users'

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    users = user.recommended_users
    users
  end

  def result_if_error_occurred
    []
  end

end

Users::InterestingUsersField = GraphQL::Relay::ConnectionField.create(field)
