Activities::FlagActivityAsFavoriteMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "flagActivityAsFavorite"
  description 'flag activity (feed item) as favorite by current user'

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.blank?

    activity = Activity.find_by(id: inputs[:id])
    return custom_error('Record not found', ctx) if activity.nil?
    return custom_error('Record is already favorite', ctx) if user.favorite_activities.find_by(activity_id: activity.id).present?

    fa = user.favorite_activities.create(activity_id: activity.id)
    if fa.persisted?
      {status: true}
    else
      return_errors(fa, ctx)
    end
  }

  def result_if_error_occurred
    { status: false }
  end

end
