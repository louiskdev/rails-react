Bubbles::ChangeBubbleInterestsMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "changeBubbleInterests"
  description I18n.t('graphql.mutations.changeBubbleInterests.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.changeBubbleInterests.args.bubble_id')
  input_field :interests, !types[types.String], I18n.t('graphql.mutations.changeBubbleInterests.args.interests')

  # resolve must return a hash with these keys
  return_field :bubble, BubbleType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('Access denied', ctx) unless user.can_manage?(bubble)

    if bubble.apply_interests(inputs[:interests])
      # real-time notification
      notify!(user, bubble)

      {bubble: bubble}
    else
      add_custom_error('Something went wrong', ctx)
    end
  end

  def notify!(user, bubble)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-bubble-#{bubble.permalink}",
        event: 'bubble_interests_changed',
        data: {
            bubble_data: {
                id: bubble.id,
                permalink: bubble.permalink,
                interests: bubble.interests.pluck(:name)
            }
        },
        debug_info: {
            location: 'Bubbles::ChangeBubbleInterestsMutation',
            bubble_id: bubble.id,
            bubble_name: bubble.name,
            interests: bubble.interests.pluck(:name),
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {bubble: nil}
  end
end
