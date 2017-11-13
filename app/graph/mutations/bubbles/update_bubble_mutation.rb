Bubbles::UpdateBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "updateBubble"
  description I18n.t('graphql.mutations.updateBubble.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.updateBubble.args.id')
  input_field :name, types.String, I18n.t('graphql.mutations.updateBubble.args.name')
  input_field :zip_code, types.String, I18n.t('graphql.mutations.updateBubble.args.zip_code')
  input_field :description, types.String, I18n.t('graphql.mutations.updateBubble.args.description')
  # input_field :type, types.String, I18n.t('graphql.mutations.updateBubble.args.type')
  input_field :avatar, types.String, I18n.t('graphql.mutations.updateBubble.args.avatar')
  input_field :avatar_filename, types.String, I18n.t('graphql.mutations.updateBubble.args.avatar_filename')
  input_field :interests, types.String.to_list_type, I18n.t('graphql.mutations.updateBubble.args.interests')
  input_field :cover_image, types.String, I18n.t('graphql.mutations.updateBubble.args.cover_image')

  # resolve must return a hash with these keys
  return_field :bubble, BubbleType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('User is not a moderator of this bubble', ctx) unless user.can_manage?(bubble)

    normalized_inputs = normalize_input_data(inputs)

    bubble.actor = user
    bubble.assign_attributes(bubble_params(normalized_inputs))
    bubble.invitable = bubble.privy? ? true : false

    bubble.apply_interests(normalized_inputs[:interests])
    user.apply_avatar_to_bubble(bubble, normalized_inputs[:avatar], normalized_inputs[:avatar_filename])
    bubble.apply_cover_image(normalized_inputs[:cover_image])

    if bubble.save
      # Bubble info update realtime message
      ws_msg = {
          adapter: 'pusher',
          channel: "private-bubble-#{bubble.permalink}",
          event: 'need_refresh',
          data: {
            message: 'info_updated',
            bubbleId: bubble.id,
          },
          debug_info: {
              location: 'Bubbles::UpdateBubbleMutation#info_updated',
              channel: "private-bubble-#{bubble.permalink}",
          }
      }
      RealTimeNotificationJob.perform_later(ws_msg)

      {bubble: bubble}
    else
      return_errors(bubble, ctx)
    end
  }

  def bubble_params(inputs)
    {
        name: inputs[:name],
        # kind: Bubble.normalize_kind_attr(inputs[:type]),
        zip_code: inputs[:zip_code],
        description: inputs[:description]
    }
  end

  def result_if_error_occurred
    {bubble: nil}
  end

end
