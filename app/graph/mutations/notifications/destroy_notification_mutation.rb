Notifications::DestroyNotificationMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyNotification"
  description 'destroy user notification by ID'

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      notification = Notification.find_by(id: inputs[:id])
      if notification.nil?
        add_custom_error("Notification not found", ctx)
      elsif notification.user_id == user.id
        notification.destroy
        {status: notification.destroyed?}
      else
        add_custom_error("Operation failed: user access denied", ctx)
      end
    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
