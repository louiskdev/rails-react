AdminActiveUsersResult = Struct.new(:success, :activeUsers)

Admin::AdminActiveUsersField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "adminActiveUsers"
  type Admin::AdminActiveUsersType
  description I18n.t('graphql.queries.adminActiveUsers.args.description')

  argument :start_date, types.String, I18n.t('graphql.queries.adminUsersJoinedCount.args.start_date')
  argument :end_date, types.String, I18n.t('graphql.queries.adminUsersJoinedCount.args.end_date')

  resolve -> (obj, args, ctx)  do
    user = ctx[:current_user]
    if user.nil?
      return add_custom_error('User is unauthorized', ctx)
    elsif user.admin == 0
      return add_custom_error('User is unauthorized', ctx)
    else
      active_users = ActiveUser.all
      if args[:start_date].present?
        active_users = active_users.where("date >= :value", value: args[:start_date])
      end
      if args[:end_date].present?
        active_users = active_users.where("date <= :value", value: args[:end_date])
      end
      count = 0
      active_users.each do |record|
        count += record.count
      end
      result = AdminActiveUsersResult.new
      result[:success] = true
      result[:activeUsers] = count
      result
    end
  end

  def result_if_error_occurred
    result = AdminActiveUsersResult.new
    result[:success] = false
    result
  end

end
