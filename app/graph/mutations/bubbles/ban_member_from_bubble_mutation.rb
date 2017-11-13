Bubbles::BanMemberFromBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "banMemberFromBubble"
  description I18n.t('graphql.mutations.banMemberFromBubble.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.banMemberFromBubble.args.bubble_id')
  input_field :member_id, !types.Int, I18n.t('graphql.mutations.banMemberFromBubble.args.member_id')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('User is not an owner of this bubble', ctx) unless user.is_owner_of?(bubble)

    member = bubble.members.find_by(id: inputs[:member_id])
    return custom_error('Member not found', ctx) if member.nil?

    bm = member.bubble_members.find_by(bubble_id: bubble.id)
    return custom_error('Member not found', ctx) if bm.nil?

    bm.destroy
    if bm.destroyed?
      notify_bubble_members(bubble, member.id)
      bu = bubble.bubble_blocked_users.build(user_id: member.id)
      bu.save
      {status: true}
    else
      {status: false}
    end
  end

  def result_if_error_occurred
    {status: false}
  end

  def notify_bubble_members(bubble, member_id)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-bubble-#{bubble.permalink}",
        event: 'need_refresh',
        data: {
          message: 'user_banned',
          bubbleId: bubble.id,
          userId: member_id,
        },
        debug_info: {
            location: 'Bubbles::BanMemberFromBubbleMutation#notify_bubble_members',
            channel: "private-bubble-#{bubble.permalink}",
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
