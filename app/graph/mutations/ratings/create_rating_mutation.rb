Ratings::CreateRatingMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "rateObject"
  description 'User rates some object'

  # Accessible from `input` in the resolve function:
  input_field :object_type, !types.String
  input_field :object_id, !types.Int
  input_field :rating, !types.Int

  # resolve must return a hash with these keys
  return_field :object, RatingableInterface

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      object = inputs[:object_type].constantize.find_by(id: inputs[:object_id])
      if object.nil?
        add_custom_error("#{inputs[:object_type].capitalize} not found", ctx)
      elsif !object.respond_to?(:rating)
        add_custom_error("Instance of #{inputs[:object_type].capitalize} type cannot be rated", ctx)
      elsif user.set_rating_for(object, inputs[:rating])
        object.reload

        # real-time notification
        notify!(user, object)

        {object: object}
      else
        add_custom_error("Failed to rate the #{inputs[:object_type].downcase}", ctx)
      end

    end
  end

  def notify!(user, object)
    rating, raters_count = object.rating_info
    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'rating_changed',
        data: {
            message: {
                object_type: object.class.name,
                object_id: object.id,
                raters_count: raters_count,
                rating: rating,
                username: user.username
            }
        },
        debug_info: {
            location: 'Ratings::CreateRatingMutation#notify!',
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
