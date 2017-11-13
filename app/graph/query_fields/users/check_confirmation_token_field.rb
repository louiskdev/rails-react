Users::CheckConfirmationTokenField = GraphQL::Field.define do
  name "checkConfirmationToken"
  type !types.String
  description I18n.t('graphql.queries.checkConfirmationToken.description')

  argument :token, !types.String, I18n.t('graphql.queries.checkConfirmationToken.args.token')

  resolve -> (obj, args, ctx) do
    user = User.find_by(confirmation_token: args[:token])
    if user.nil?
      'Invalid'
    elsif user.completed?
      'Confirmed'
    else
      'Ok'
    end
  end

end
