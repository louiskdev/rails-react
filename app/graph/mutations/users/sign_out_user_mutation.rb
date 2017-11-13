Users::SignOutUserMutation = GraphQL::Relay::Mutation.define do

  # Used to name derived types:
  name "signOutUser"
  description 'sign out user'

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :user, UserType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.present?
      ApiKey.destroy_all(user_id: user.id, client_id: user.current_client_id)

      # Send signout notification to friends
      user.friends.each do |friend|
        ws_msg = {
            adapter: 'pusher',
            channel: "private-user-#{friend.id}",
            event: 'important',
            data: {
                message: 'need_to_reload_notifications',
                type: 'user',
                action: 'signout',
                userId: user.id
            },
            debug_info: {
                location: 'Users::SignOutUserMutation',
                friend_id: friend.id,
                user_id: user.id
            }
        }
        RealTimeNotificationJob.perform_later(ws_msg)
      end
    end

    {user: nil}
  }

end
