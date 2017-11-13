Call::InitiateGroupCallMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "initiateGroupCall"
  description I18n.t('graphql.mutations.initiateGroupCall.description')

  # Accessible from `input` in the resolve function:
  input_field :channel_id, !types.Int, I18n.t('graphql.mutations.initiateGroupCall.args.channel_id')
  input_field :video_call, !types.Boolean, I18n.t('graphql.mutations.initiateGroupCall.args.video_call')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean
  return_field :session_id, types.String
  return_field :token, types.String

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    current_user = ctx[:current_user]
    return custom_error('Access denied', ctx) unless current_user.present?

    channel_id = inputs[:channel_id]
    channel = Widgets::ChatWidget::Channel.find(channel_id)
    return custom_error('Channel not found', ctx) unless channel.present?

    unless channel.kind == 'global' or current_user.is_member_of_the_channel?(channel)
      return custom_error('Not authorized to join this channel call session', ctx)
    end

    callSession = CallSession.request_group_call(current_user.id, channel_id)
    return custom_error('Failed to initiate session', ctx) unless callSession.present?

    streamData = {
      user_id: current_user.id,
      username: current_user.username,
      avatar: current_user.avatar_url,
    }

    {
      status: true,
      session_id: callSession.session_id,
      token: callSession.create_token(streamData.to_json)
    }
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
