AdminUsersJoinedResult = Struct.new(:success, :totalUsers)

Admin::AdminUsersJoinedCountField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "adminUsersJoinedCount"
  type Admin::AdminUserInfoType
  description I18n.t('graphql.queries.adminUsersJoinedCount.args.description')

  argument :start_date, types.String, I18n.t('graphql.queries.adminUsersJoinedCount.args.start_date')
  argument :end_date, types.String, I18n.t('graphql.queries.adminUsersJoinedCount.args.end_date')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      return add_custom_error('User is unauthorized', ctx)
    elsif user.admin == 0
      return add_custom_error('User is unauthorized', ctx)
    else
      users = User.all
      if args[:start_date].present?
        users = users.where("confirmed_at >= :value", value: args[:start_date])
      end
      if args[:end_date].present?
        users = users.where("confirmed_at <= :value", value: args[:end_date])
      end
      result = AdminUsersJoinedResult.new
      result[:success] = true
      result[:totalUsers] = users.count
      result
    end
  end

  def result_if_error_occurred
    result = AdminUsersJoinedResult.new
    result[:success] = false
    result
  end

end
