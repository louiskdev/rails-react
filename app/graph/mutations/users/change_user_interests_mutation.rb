Users::ChangeUserInterestsMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "changeUserInterests"
  description I18n.t('graphql.mutations.changeUserInterests.description')

  # Accessible from `input` in the resolve function:
  input_field :interests, !types[types.String], I18n.t('graphql.mutations.changeUserInterests.args.interests')

  # resolve must return a hash with these keys
  return_field :user, UserType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    if user.apply_interests(inputs[:interests])
      # real-time notification
      notify!(user)

      {user: user}
    else
      add_custom_error('Something went wrong', ctx)
    end
  end

  def notify!(user)
    new_interests = user.interests.pluck(:name)
    ws_msg = {
        adapter: 'pusher',
        channel: "profile-page-#{user.id}",
        event: 'user_interests_changed',
        data: {
            user_data: {
                id: user.id,
                username: user.username,
                interests: new_interests
            }
        },
        debug_info: {
            location: 'Users::ChangeUserInterestsMutation',
            interests: new_interests,
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {user: nil}
  end

end
