Friendships::DestroyFriendshipMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyFriendship"
  description 'User terminates friendship'

  # Accessible from `input` in the resolve function:
  input_field :friend_id, !types.Int

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      friend = User.find_by(id: inputs[:friend_id])
      if friend.nil?
        add_custom_error('User not found', ctx)
      else
        friendship = Friendship.find_by(user_id: user.id, friend_id: friend.id)
        inverse_friendship = Friendship.find_by(user_id: friend.id, friend_id: user.id)
        if friendship.nil? and inverse_friendship.nil?
          add_custom_error('Record not found', ctx)
        else
          if friendship.present?
            old_friendship_status = friendship.status  # Debug Info
            friendship.destroy
            if friendship.destroyed?
              if friendship.pending?
                Notification.destroy_all(user_id: friendship.user_id, initiator_id: friendship.friend_id, initiator_type: 'User', name: 'friendships:create')
              end
              Notification.destroy_all(user_id: friendship.friend_id, initiator_id: friendship.user_id, initiator_type: 'User', name: 'friendships:decline')

              # real-time notification
              ws_msg = {
                  adapter: 'pusher',
                  channel: ["private-user-#{friendship.friend_id}", "private-user-#{friendship.user_id}"],
                  event: 'important',
                  data: {
                      message: 'need_to_reload_notifications',
                      type: 'friendship',
                      action: 'destroy'
                  },
                  debug_info: {
                      location: 'Friendships::DestroyFriendshipMutation',
                      friendship_id: friendship.id,
                      old_friendship_status: old_friendship_status,
                      friend_id: friend.id,
                      user_id: user.id
                  }
              }
              RealTimeNotificationJob.perform_later(ws_msg)
            end
          end

          if inverse_friendship.present?
            old_friendship_status = inverse_friendship.status  # Debug Info
            inverse_friendship.destroy
            if inverse_friendship.destroyed?
              if inverse_friendship.pending?
                Notification.destroy_all(user_id: inverse_friendship.user_id, initiator_id: inverse_friendship.friend_id, initiator_type: 'User', name: 'friendships:create')
              end
              Notification.destroy_all(user_id: inverse_friendship.friend_id, initiator_id: inverse_friendship.user_id, initiator_type: 'User', name: 'friendships:decline')

              # real-time notification
              ws_msg = {
                  adapter: 'pusher',
                  channel: ["private-user-#{inverse_friendship.friend_id}", "private-user-#{inverse_friendship.user_id}"],
                  event: 'important',
                  data: {
                      message: 'need_to_reload_notifications'
                  },
                  debug_info: {
                      location: 'Friendships::DestroyFriendshipMutation',
                      friendship_id: inverse_friendship.id,
                      old_friendship_status: old_friendship_status,
                      friend_id: friend.id,
                      user_id: user.id
                  }
              }
              RealTimeNotificationJob.perform_later(ws_msg)
            end
          end

          {status: true}
        end
      end
    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
