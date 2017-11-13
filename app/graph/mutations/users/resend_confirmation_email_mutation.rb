Users::ResendConfirmationEmailMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "resendConfirmationEmail"
  description 'resend new user confirmation email'

  # Accessible from `input` in the resolve function:
  input_field :email, !types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :email, types.String

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = User.find_by(email: inputs[:email])
    if user.nil?
      add_custom_error("Unregistered email", ctx)
    elsif user.confirmed?
      add_custom_error("Email is already confirmed", ctx)
    else
      user.resend_confirmation_instructions
      {email: user.email}
    end
  }

  def result_if_error_occurred
    {email: inputs[:email]}
  end

end
