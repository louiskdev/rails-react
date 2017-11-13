Users::SignInUserMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "signInUser"
  description 'sign in user'

  # Accessible from `input` in the resolve function:
  input_field :login, !types.String
  input_field :password, !types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :user, UserType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = User.find_for_database_authentication(email: inputs[:login])
    if user.present? and user.valid_password?(inputs[:password])
      _, client_id = user.reset_access_token!
      user.current_client_id = client_id
      ctx[:current_user] = user
      ActiveUser.add_count
      {user: user}
    else
      add_custom_error('Login or password is invalid', ctx)
    end
  }

  def result_if_error_occurred
    {user: nil}
  end

end
