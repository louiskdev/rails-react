Likes::CreateLikeMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "createLike"
  description 'User likes some object'

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
      elsif user.like! object
        object.reload

        # real-time notification
        notify!(user, object)

        # notify author
        author = if object.respond_to?(:user)
                   object.user
                 elsif object.respond_to?(:uploader)
                   object.uploader
                 else
                   object.owner
                 end

        if user.id != author.id
          class_name = object.class.name == 'Widgets::BlogWidget::Post' ? "post" : "#{object.class.name.downcase}"
          notification_attrs = {user_id: author.id,
                                initiator_type: 'User',
                                initiator_id: user.id,
                                name: "#{class_name}:liked"}
          unless object.is_a?(Bubble)
            obj = object.is_a?(Comment) || object.is_a?(Medium) || object.is_a?(Album) ? object : object.activities.where(feed: true).last
            notification_attrs.merge!(object_type: obj.class.name, object_id: obj.id) unless obj.nil?
          end
          Notification.create(notification_attrs)
        end

        {object: object}
      else
        add_custom_error("Failed to like the #{inputs[:object_type].downcase}", ctx)
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
                type: 'liked',
                user: {
                    id: user.id,
                    username: user.username,
                    first_name: user.first_name
                }
            }
        },
        debug_info: {
            location: 'Likes::CreateLikeMutation#notify!',
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
