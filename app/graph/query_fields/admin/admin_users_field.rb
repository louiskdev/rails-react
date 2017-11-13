AdminUsersResult = Struct.new(:success, :totalUsers, :averageSessionTime)

Admin::AdminUsersField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "adminUsers"
  type Admin::AdminUserInfoType
  description I18n.t('graphql.queries.adminUsers.args.description')

  resolve -> (obj, args, ctx)  do
    user = ctx[:current_user]
    if user.nil?
      return add_custom_error('User is unauthorized', ctx)
    elsif user.admin == 0
      return add_custom_error('User is unauthorized', ctx)
    else
      result = AdminUsersResult.new
      result[:success] = true
      result[:totalUsers] = User.all.count
      session_time_record = OnlineTime.first
      if session_time_record.present?
        result[:averageSessionTime] = session_time_record.average_session_time
      else
        result[:averageSessionTime] = 0
      end
      result
    end
  end

  def result_if_error_occurred
    result = AdminUsersResult.new
    result[:success] = false
    result
  end

end
