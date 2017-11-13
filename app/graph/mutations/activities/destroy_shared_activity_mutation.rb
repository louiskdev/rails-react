Activities::DestroySharedActivityMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroySharedActivity"
  description I18n.t('graphql.mutations.destroySharedActivity.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.destroySharedActivity.args.id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.blank?

    activity = Activity.shared.find_by(id: inputs[:id])
    return custom_error('Shared activity not found', ctx) if activity.nil?

    if activity.user_id == user.id
      activity.destroy
      if activity.destroyed?
        notify!(user, activity)
        {status: true}
      else
        result_if_error_occurred
      end
    else
      add_custom_error('Access denied', ctx)
    end
  end

  def notify!(current_user, activity)
    ws_msg = {
        adapter: 'pusher',
        event: 'activity_removed',
        data: {
            activity_id: activity.id,
        },
        debug_info: {
            location: 'Activities::DestroySharedActivityMutation#notify!',
            activity_id: activity.id,
            user_id: current_user.id
        }
    }

    channels = ["private-dashboard-#{current_user.id}", "profile-page-#{current_user.id}"]
    current_user.friends.online_users.each { |friend| channels << "private-user-#{friend.id}" }
    ws_msg[:channel] = channels
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
