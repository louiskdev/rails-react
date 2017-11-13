Activities::ShareActivityMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "shareActivity"
  description 'share activity entry from friends feed'

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean
  return_field :activity, ActivityType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      activity = Activity.find_by(id: inputs[:id])
      if activity.nil?
        add_custom_error('Record not found', ctx)
      else
        if user.id == activity.user_id  # need check on privacy of the activity to be shared
          return {status: false}
        else
          newActivity = Activity.create(name: activity.name, user_id: user.id, user_ip: user.current_sign_in_ip, feed: true, shared: true,
                    object_id: activity.object_id, object_type: activity.object_type, privacy: activity.privacy, bubble_id: activity.bubble_id,
                    original_user_id: activity.original_user_id ? activity.original_user_id : activity.user_id)
          return {status: true}
        end
      end
    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
