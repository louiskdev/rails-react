Likes::DestroyLikeMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyLike"
  description 'User unlikes some object'

  # Accessible from `input` in the resolve function:
  input_field :object_type, !types.String
  input_field :object_id, !types.Int

  # resolve must return a hash with these keys
  return_field :object, LikeableInterface

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      object = inputs[:object_type].constantize.find_by(id: inputs[:object_id])
      if object.nil?
        add_custom_error("#{inputs[:object_type].capitalize} not found", ctx)
      elsif !object.respond_to?(:is_likeable?)
        add_custom_error("Instance of #{inputs[:object_type].capitalize} type cannot be liked", ctx)
      elsif user.unlike! object
        object.reload

        # real-time notification
        notify!(user, object)

        {object: object}
      else
        add_custom_error("Failed to unlike the #{inputs[:object_type].downcase}", ctx)
      end

    end
  end

  def notify!(user, object)
    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'likes_count_changed',
        data: {
            message: {
                object_type: object.class.name,
                object_id: object.id,
                likes_count: object.likers_count,
                username: user.username,
                type: 'unliked',
                user: {
                    id: user.id,
                    username: user.username,
                    first_name: user.first_name
                }
            }
        },
        debug_info: {
            location: 'Likes::DestroyLikeMutation#notify!',
            object_type: object.class.name,
            object_id: object.id,
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {object: nil}
  end

end
