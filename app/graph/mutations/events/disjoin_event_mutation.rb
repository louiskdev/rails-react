Events::DisjoinEventMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "disjoinEvent"
  description I18n.t('graphql.mutations.disjoinEventMutation.description')

  # Accessible from `input` in the resolve function:
  input_field :event_id, !types.Int, I18n.t('graphql.mutations.disjoinEventMutation.args.event_id')

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    event = Event.find_by(id: inputs[:event_id])
    return custom_error('Event not found', ctx) if event.nil?
    return custom_error('User is not a member of this event', ctx) unless user.is_participant_of?(event)

    em = event.event_members.find_by(user_id: user.id)
    em.destroy
    if em.destroyed?
      {status: true}
    else
      return_errors(em, ctx)
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
