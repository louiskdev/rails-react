Call::RejectCallMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "rejectCall"
  description I18n.t('graphql.mutations.rejectCall.description')

  # Accessible from `input` in the resolve function:
  input_field :session_id, !types.String, I18n.t('graphql.mutations.rejectCall.args.session_id')
  input_field :caller_id, !types.Int, I18n.t('graphql.mutations.rejectCall.args.caller_id')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    current_user = ctx[:current_user]
    return custom_error('Access denied', ctx) unless current_user.present?

    # real-time notification
    ws_msg = {
        adapter: 'pusher',
        channel: "private-user-#{inputs[:caller_id]}",
        event: 'call-rejected',
        data: {
            session_id: inputs[:session_id],
            user_id: inputs[:caller_id],
        },
        debug_info: {
            location: 'Call::RejectCallMutation',
            initiator_id: current_user.id,
            session_id: inputs[:session_id],
            user_id: inputs[:caller_id],
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)

    {status: true}
  end

  def result_if_error_occurred
    {status: false, session_id: nil, token: nil}
  end

  def return_errors(obj, ctx)
    obj.errors.full_messages.each { |msg| ctx.errors << GraphQL::ExecutionError.new(msg) }
    GraphQL::Language::Visitor::SKIP
    {status: false, confirmation_token: nil}
  end
end
