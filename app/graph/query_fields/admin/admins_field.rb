field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "admins"
  type UserType.connection_type
  description I18n.t('graphql.queries.admins.args.description')

  resolve -> (obj, args, ctx)  do
    user = ctx[:current_user]
    if user.nil?
      return add_custom_error('User is unauthorized', ctx)
    elsif user.admin == 0
      return add_custom_error('User is unauthorized', ctx)
    else
      admins = User.where('admin != 0')
      admins
    end
  end

  def result_if_error_occurred
    []
  end

end

Admin::AdminsField = GraphQL::Relay::ConnectionField.create(field)
