Friendships::BlockFriendshipMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "blockFriendship"
  description 'User blocks friendship request from another user'

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
        if friendship.nil?
          add_custom_error('Record not found', ctx)
        elsif friendship.update(status: Friendship.statuses[:blocked])
          inverse_friendship = Friendship.find_by(user_id: friend.id, friend_id: user.id)
          if inverse_friendship.nil?
            friend.friendships.create(friend_id: user.id, status: Friendship.statuses[:pending])
          else
            inverse_friendship.update(status: Friendship.statuses[:pending])
          end

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
