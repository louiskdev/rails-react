field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "adminCommonKeywords"
  type InterestType.connection_type
  description I18n.t('graphql.queries.adminCommonKeywords.args.description')

  resolve -> (obj, args, ctx)  do
    user = ctx[:current_user]
    if user.nil?
      return add_custom_error('User is unauthorized', ctx)
    elsif user.admin == 0
      return add_custom_error('User is unauthorized', ctx)
    else
      common_keywords = Interest.order(counter: :desc)
      common_keywords
    end
  end

  def result_if_error_occurred
    []
  end

end

Admin::AdminCommonKeywordsField = GraphQL::Relay::ConnectionField.create(field)
