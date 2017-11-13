Notifications::TouchNotificationMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "touchNotification"
  description I18n.t('graphql.mutations.touchNotification.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.touchNotification.args.id')

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      notification = user.received_notifications.find_by(id: inputs[:id])
      if notification.nil?
        add_custom_error("Notification not found", ctx)
      else
        status = notification.update(read_at: Time.now)
        {status: status}
      end

    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
