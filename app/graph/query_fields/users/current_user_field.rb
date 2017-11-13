Users::CurrentUserField = GraphQL::Field.define do
  name "currentUser"
  type UserType
  description 'Get current user info'

  resolve -> (obj, args, ctx) { ctx[:current_user].present? ? ctx[:current_user] : nil }
end
