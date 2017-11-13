AdminZipCodesResult = Struct.new(:success, :zip_codes)

Admin::AdminZipCodesUsedField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "adminZipCodesUsed"
  type Admin::AdminZipCodesType
  description I18n.t('graphql.queries.adminZipCodesUsed.args.description')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      return add_custom_error('User is unauthorized', ctx)
    elsif user.admin == 0
      return add_custom_error('User is unauthorized', ctx)
    else
      zip_codes_result = ActiveRecord::Base.connection.execute("(SELECT DISTINCT zip_code FROM users) UNION (SELECT DISTINCT zip_code FROM bubbles)")
      zip_code_objs = zip_codes_result.values
      zip_codes = []
      for zip_code_obj in zip_code_objs
        zip_codes << zip_code_obj[0]
      end
      result = AdminZipCodesResult.new
      result[:success] = true
      result[:zip_codes] = zip_codes
      result
    end
  end

  def result_if_error_occurred
    result = AdminZipCodesResult.new
    result[:success] = false
    result
  end

end
