Bubbles::JoinMeToBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "joinMeToBubble"
  description I18n.t('graphql.mutations.joinMeToBubble.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.joinMeToBubble.args.bubble_id')

  # resolve must return a hash with these keys
  return_field :bubble, -> { BubbleType }

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('User can join this bubble only by invite', ctx) if bubble.invitable?
    return custom_error('User is already a member of this bubble', ctx) if user.is_member_of?(bubble)

    bu = bubble.blocked_users.find_by(id: user.id)
    return custom_error("You're banned from this bubble", ctx) if bu.present?

    bm = bubble.bubble_members.build(member: user, user_role: BubbleMember.user_roles[:guest], online: true)
    if bm.save
      {bubble: bubble}
    else
      return_errors(bm, ctx)
    end
  end

  def result_if_error_occurred
    {bubble: nil}
  end
end
