Bubbles::DisjoinMeFromBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "disjoinMeFromBubble"
  description I18n.t('graphql.mutations.disjoinMeFromBubble.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.disjoinMeFromBubble.args.bubble_id')

  # resolve must return a hash with these keys
  return_field :bubble, -> { BubbleType }

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('User is not a member of this bubble', ctx) unless user.is_member_of?(bubble)
    return custom_error('Owner cannot leave the bubble', ctx) if bubble.owner == user

    bm = bubble.bubble_members.find_by(user_id: user.id)
    bm.destroy
    if bm.destroyed?
      {bubble: bubble}
    else
      return_errors(bm, ctx)
    end
  end

  def result_if_error_occurred
    {bubble: nil}
  end

end
