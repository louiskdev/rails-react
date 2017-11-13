Admin::SendMassEmailMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "sendMassEmail"
  description I18n.t('graphql.mutations.sendMassEmail.description')

  # Accessible from `input` in the resolve function:
  input_field :subject, !types.String, I18n.t('graphql.mutations.sendMassEmail.args.subject')
  input_field :content, !types.String, I18n.t('graphql.mutations.sendMassEmail.args.content')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      return custom_error('User is unauthorized', ctx)
    elsif current_user.admin == 0
      return custom_error('User is unauthorized', ctx)
    else
      # User.where('id != :user_id', user_id: current_user.id).each do |user|
      #   UserMailer.send_custom_email(user.email, inputs[:subject], inputs[:content])
      # end
      # For testing newsletter email
      UserMailer.send_custom_email('stefan.miroslav6@gmail.com', inputs[:subject], inputs[:content])
    end
    {status: true}
  end

  def result_if_error_occurred
    { status: false }
  end

end
