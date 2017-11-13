Notifications::TouchAllActionNotificationsMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "touchAllActionNotifications"

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      updated_records_count = user.unread_notifications.where("name LIKE 'friendships:%'").update_all(read_at: Time.now)
      {status: updated_records_count > 0}
    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
