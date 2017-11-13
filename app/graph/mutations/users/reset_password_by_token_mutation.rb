Users::ResetPasswordByTokenMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "resetPasswordByToken"
  description 'update user password by reset_password_token'

  # Accessible from `input` in the resolve function:
  input_field :reset_password_token, !types.String
  input_field :password, !types.String
  input_field :password_confirmation, !types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :user, UserType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = User.reset_password_by_token(user_params(inputs))
    user.errors.messages.delete_if { |attr, _| attr !~ /password/ }  # FIX user validations on update
    if user.errors.empty?
      user.unlock_access! if unlockable?(user)
      ApiKey.destroy_all(user_id: user.id)
      _, client_id = user.reset_access_token!
      user.current_client_id = client_id
      ctx[:current_user] = user
      {user: user}
    else
      return_errors(user, ctx)
    end

  }

  def user_params(inputs)
    { reset_password_token: inputs[:reset_password_token],
      password: inputs[:password],
      password_confirmation: inputs[:password_confirmation] }
  end

  # Check if proper Lockable module methods are present & unlock strategy
  # allows to unlock resource on password reset
  def unlockable?(resource)
    resource.respond_to?(:unlock_access!) &&
        resource.respond_to?(:unlock_strategy_enabled?) &&
        resource.unlock_strategy_enabled?(:email)
  end

  def result_if_error_occurred
    {user: nil}
  end

end
