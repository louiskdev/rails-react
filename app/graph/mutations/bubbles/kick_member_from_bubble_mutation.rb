Bubbles::KickMemberFromBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "kickMemberFromBubble"
  description I18n.t('graphql.mutations.kickMemberFromBubble.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.kickMemberFromBubble.args.bubble_id')
  input_field :member_id, !types.Int, I18n.t('graphql.mutations.kickMemberFromBubble.args.member_id')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('User is not a moderator of this bubble', ctx) unless user.can_manage?(bubble)

    member = bubble.members.find_by(id: inputs[:member_id])
    return custom_error('Member not found', ctx) if member.nil?
    return custom_error('Owner cannot leave the bubble', ctx) if bubble.owner == member

    bm = bubble.bubble_members.find_by(user_id: member.id)
    bm.destroy
    if bm.destroyed?
      {status: true}
    else
      return_errors(bm, ctx)
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
