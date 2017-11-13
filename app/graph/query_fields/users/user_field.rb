Users::UserField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "user"
  type UserType
  description 'Get user info by username'

  argument :username, !types.String

  resolve -> (obj, args, ctx) do
    if ctx[:current_user].blank?
      add_custom_error('User is unauthorized', ctx)
    else
      User.find_by(username: args[:username])
    end
  end

  def result_if_error_occurred
    nil
  end
end
