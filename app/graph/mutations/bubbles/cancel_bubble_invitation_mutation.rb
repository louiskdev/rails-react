Bubbles::CancelBubbleInvitationMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "cancelBubbleInvitation"
  description I18n.t('graphql.mutations.cancelBubbleInvitation.description')

  # Accessible from `input` in the resolve function:
  input_field :token, !types.String, I18n.t('graphql.mutations.cancelBubbleInvitation.args.token')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bi = BubbleInvitation.find_by(token: inputs[:token])
    return custom_error('Invitation not found', ctx) if bi.nil?
    return custom_error('Access denied', ctx) if bi.new_member_id != user.id

    if bi.moderator_id.present?
      bi.update(status: 'declined')
      {status: true}
    end
  end

  def result_if_error_occurred
    {status: false}
  end
end
