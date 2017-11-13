Statistics::ReportOnlineTimeMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "reportOnlineTime"
  description 'report online time of a user'

  # online time in seconds
  input_field :session_time, !types.Int

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      OnlineTime.addRecord inputs[:session_time]
      {status: true}
    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
