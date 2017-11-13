Users::CompleteAccountMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "completeAccount"
  description 'complete user account (Registration step #3)'

  # Accessible from `input` in the resolve function:
  input_field :password, !types.String
  input_field :password_confirmation, !types.String
  input_field :agree_to_terms, !types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :user, UserType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    elsif user.update(user_params(inputs))
      user.reset_access_token!
      {user: user}
    else
      return_errors(user, ctx)
    end

  }

  def user_params(inputs)
    { agree_to_terms: inputs[:agree_to_terms],
      password: inputs[:password],
      password_confirmation: inputs[:password_confirmation],
      completed: true }
  end

  def result_if_error_occurred
    {user: nil}
  end

end
