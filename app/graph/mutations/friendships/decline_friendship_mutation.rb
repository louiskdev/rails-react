Friendships::DeclineFriendshipMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "declineFriendship"
  description 'User declines the friendship request from another user'

  # Accessible from `input` in the resolve function:
  input_field :friend_id, !types.Int
  input_field :notification_id, types.Int

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      friend = User.find_by(id: normalized_inputs[:friend_id])
      if friend.nil?
        add_custom_error('User not found', ctx)
      else
        friendship = Friendship.find_by(user_id: user.id, friend_id: friend.id)
        if friendship.nil?
          add_custom_error('Record not found', ctx)
        else
          friendship.destroy
          if friendship.destroyed?
            if normalized_inputs[:notification_id].present?
              Notification.delete_all(id: normalized_inputs[:notification_id])

              # real-time notification
              notify!(friendship)
            end

            {status: true}
          else
            result_if_error_occurred
          end
        end
      end

    end
  end

  def notify!(friendship)
    ws_msg = {
        adapter: 'pusher',
        channel: ["private-user-#{friendship.user_id}", "private-user-#{friendship.friend_id}"],
        event: 'important',
        data: {
            message: 'need_to_reload_notifications',
            type: 'friendship',
            action: 'decline'
        },
        debug_info: {
            location: 'Friendships::DeclineFriendshipMutation#notify!',
            friendship_id: friendship.id,
            friend_id: friendship.friend_id,
            user_id: friendship.user_id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
