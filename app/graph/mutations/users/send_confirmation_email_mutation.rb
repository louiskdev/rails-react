Users::SendConfirmationEmailMutation = GraphQL::Relay::Mutation.define do

  # Used to name derived types:
  name "sendConfirmationEmail"
  description 'send new user confirmation email (Registration step #1)'

  # Accessible from `input` in the resolve function:
  input_field :email, !types.String

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :email, types.String

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = User.find_by(email: inputs[:email])

    if user.present?
      if user.completed?
        validate_email(User.new(email: inputs[:email]), ctx)
      elsif user.confirmation_sent_at < 5.minutes.ago
        user.send_confirmation_instructions
        user.update_column(:confirmation_sent_at, DateTime.now)
      else
        ctx.errors << GraphQL::ExecutionError.new("An email has already been sent to you during the last 5 minutes. Please, wait and check your email inbox once again.")
        GraphQL::Language::Visitor::SKIP
      end
    else
      user = User.new(email: inputs[:email])
      user.save(validate: false) if validate_email(user, ctx)
    end

    {email: inputs[:email]}
  }


  def validate_email(user, ctx)
    user.validate
    if user.errors[:email].present?
      user.errors[:email].map { |msg| ctx.errors << GraphQL::ExecutionError.new("Email #{msg}") }
      GraphQL::Language::Visitor::SKIP
      false
    else
      true
    end
  end

end
