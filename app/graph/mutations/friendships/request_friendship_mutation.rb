Friendships::RequestFriendshipMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "requestFriendship"
  description 'User sends a friendship request to another user'

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
        friendship = friend.friendships.build(friend_id: user.id, status: Friendship.statuses[:pending])
        if friendship.save
          {status: true}
        else
          return_errors(friendship, ctx)
        end
      end

    end
  }

  def result_if_error_occurred
    {status: false}
  end

end
