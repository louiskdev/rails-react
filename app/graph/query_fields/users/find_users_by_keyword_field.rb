field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "findUsersByKeyword"
  type UserType.connection_type
  description 'Users search by keywords. Keywords can be part of username.'

  argument :keyword, !types.String

  resolve -> (obj, args, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      users = current_user.friends.where("username ILIKE :text OR users.first_name ILIKE :text", text: "%#{args[:keyword]}%")
      users
    end
  end

  def result_if_error_occurred
    []
  end
end

Users::FindUsersByKeywordField = GraphQL::Relay::ConnectionField.create(field)
