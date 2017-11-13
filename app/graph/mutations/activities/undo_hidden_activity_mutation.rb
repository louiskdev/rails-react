Activities::UndoHiddenActivityMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "undoHiddenActivity"
  description 'undo hidden activity entry from feed'

  # Accessible from `input` in the resolve function:
  input_field :location, !types.String
  input_field :bubble_permalink, types.String   # used only when location is bubble_feed, for real-time msgs to bubble feed
  input_field :feed_user_id, types.Int          # used only when location is user_feed, for real-time msgs to user feed

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      Ignoring.where(user_id: user.id, location: normalized_inputs[:location]).destroy_all

      # realtime notifications
      user_id = normalized_inputs[:feed_user_id] || user.id
      bubble_permalink = normalized_inputs[:location] == 'bubble_feed' ? normalized_inputs[:bubble_permalink] : nil
      notify!(normalized_inputs[:location], user_id, bubble_permalink)

      {status: true}
    end
  }

  def notify!(location, user_id, bubble_permalink)
    channels = ["private-dashboard-#{user_id}"]
    channels << "private-bubble-#{bubble_permalink}" unless bubble_permalink.nil?
    ws_msg = {
        adapter: 'pusher',
        channel: channels,
        event: 'activity_undo_hidden',
        data: {
            location: location
        },
        debug_info: {
            location: 'Activities::UndoHiddenActivityMutation#notify!',
            user_id: user_id,
            input_location: location
        }
    }

    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
