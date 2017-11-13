Notifications::DestroyAllNotificationsMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyAllNotifications"
  description 'destroy all user notifications'

  # resolve must return a hash with these keys
  return_field :notifications, !NotificationType.to_list_type

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      Notification.where(user_id: user.id).destroy_all
      notifications = user.unread_notifications.all
      {notifications: notifications}
    end
  }

  def result_if_error_occurred
    {notifications: []}
  end

end