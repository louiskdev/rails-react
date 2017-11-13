Activities::HideActivityMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "hideActivity"
  description 'hide activity entry from feed'

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int
  input_field :location, !types.String
  input_field :feed_user_id, types.Int          # used only when location is user_feed, for real-time msgs to user feed

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      activity = Activity.find_by(id: inputs[:id])
      if activity.nil?
        add_custom_error('Record not found', ctx)
      else
        normalized_inputs = normalize_input_data(inputs)
        status = Ignoring.find_or_create_by(user_id: user.id, ignorable_type: activity.class.name, ignorable_id: activity.id, location: normalized_inputs[:location]).persisted?

        # realtime notifications
        notify!(user, activity, normalized_inputs) if status

        {status: status}
      end
    end
  end

  def notify!(user, activity, options)
    ws_msg = {
        adapter: 'pusher',
        event: 'activity_removed',
        data: {
            activity_id: activity.id,
        },
        debug_info: {
            location: 'Activities::HideActivityMutation#notify!',
            user_id: user.id,
            activity_id: activity.id,
            input_location: options[:location]
        }
    }

    if activity.bubble_id.present?
      bubble = Bubble.find_by(id: activity.bubble_id)
      if bubble.present?
        ws_msg[:channel] = "private-bubble-#{bubble.permalink}"
        RealTimeNotificationJob.perform_later(ws_msg)
      end
    end

    ws_msg[:data][:location] = options[:location]
    ws_msg[:channel] = if options[:feed_user_id].present?
                         "private-dashboard-#{options[:feed_user_id]}"
                       else
                         "private-dashboard-#{user.id}"
                       end
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
