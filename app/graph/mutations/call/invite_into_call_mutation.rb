Call::InviteIntoCallMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "inviteIntoCall"
  description I18n.t('graphql.mutations.inviteIntoCall.description')

  # Accessible from `input` in the resolve function:
  input_field :receiver_id, !types.Int, I18n.t('graphql.mutations.inviteIntoCall.args.receiver_id')
  input_field :session_id, !types.String, I18n.t('graphql.mutations.inviteIntoCall.args.session_id')
  input_field :video_call, !types.Boolean, I18n.t('graphql.mutations.inviteIntoCall.args.video_call')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    current_user = ctx[:current_user]
    return custom_error('Access denied', ctx) unless current_user.present?

    calling_user = User.find inputs[:receiver_id]
    return custom_error('Tried to call invalid user', ctx) unless calling_user.present?

    callSession = CallSession.where(session_id: inputs[:session_id]).first
    return custom_error('Failed to acquire session', ctx) unless callSession.present?

    myData = {
      user_id: calling_user.id,
      username: calling_user.username,
      avatar: calling_user.avatar_url
    }
    receiverToken = callSession.create_token myData.to_json

    # real-time notification
    ws_msg = {
        adapter: 'pusher',
        channel: "private-user-#{inputs[:receiver_id]}",
        event: 'calling',
        data: {
            session_id: callSession.session_id,
            token: receiverToken,
            caller_id: current_user.id,
            caller_name: current_user.username,
            caller_avatar: current_user.avatar_url,
            video_call: inputs[:video_call],
        },
        debug_info: {
            location: 'Call::InviteIntoCallMutation',
            initiator_id: current_user.id,
            receiver_id: inputs[:receiver_id],
            session_id: callSession.session_id,
            token: receiverToken,
            caller_id: current_user.id,
            caller_name: current_user.username,
            video_call: inputs[:video_call],
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)

    {
      status: true,
    }
  end

  def result_if_error_occurred
    { status: false }
  end

end
