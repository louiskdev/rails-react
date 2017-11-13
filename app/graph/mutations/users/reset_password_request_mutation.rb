Users::ResetPasswordRequestMutation = GraphQL::Relay::Mutation.define do

  # Used to name derived types:
  name "resetPasswordRequest"
  description 'send reset password request'

  # Accessible from `input` in the resolve function:
  input_field :login, !types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :login, types.String

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = User.find_by_login(inputs[:login])
    if user.nil? or !user.completed?
      ctx.errors << GraphQL::ExecutionError.new('User not found')
      GraphQL::Language::Visitor::SKIP
    else
      user.send_reset_password_instructions
    end

    {login: inputs[:login]}
  }

end
