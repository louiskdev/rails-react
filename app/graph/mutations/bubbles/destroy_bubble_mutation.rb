Bubbles::DestroyBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyBubble"
  description I18n.t('graphql.mutations.destroyBubble.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.destroyBubble.args.id')

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      bubble = Bubble.find_by(id: inputs[:id])
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) unless user.is_owner_of?(bubble)

      bubble.actor = user
      bubble.destroy
      {status: bubble.destroyed?}
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
