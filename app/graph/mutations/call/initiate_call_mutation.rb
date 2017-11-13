Call::InitiateCallMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "initiateCall"
  description I18n.t('graphql.mutations.initiateCall.description')

  # Accessible from `input` in the resolve function:
  input_field :receiver_id, !types.Int, I18n.t('graphql.mutations.initiateCall.args.receiver_id')
  input_field :video_call, !types.Boolean, I18n.t('graphql.mutations.initiateCall.args.video_call')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean
  return_field :session_id, types.String
  return_field :token, types.String

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    current_user = ctx[:current_user]
    return custom_error('Access denied', ctx) unless current_user.present?

    calling_user = User.find inputs[:receiver_id]
    return custom_error('Tried to call invalid user', ctx) unless calling_user.present?

    callSession = CallSession.request_direct_call(current_user.id, inputs[:receiver_id])
    return custom_error('Failed to initiate session', ctx) unless callSession.present?

    myData = {
      user_id: current_user.id,
      username: current_user.username,
      avatar: current_user.avatar_url
    }
    myToken = callSession.create_token myData.to_json

    receiverData = {
      user_id: calling_user.id,
      username: calling_user.username,
      avatar: calling_user.avatar_url
    }
    receiverToken = callSession.create_token receiverData.to_json

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
            location: 'Call::InitiateCallMutation',
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
      session_id: callSession.session_id,
      token: myToken
    }
  end

  def result_if_error_occurred
    { status: false, session_id: nil, token: nil }
  end

end
