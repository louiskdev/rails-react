Comments::CreateCommentMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createComment"
  description 'User comments some object'

  # Accessible from `input` in the resolve function:
  input_field :object_type, !types.String
  input_field :object_id, !types.Int
  input_field :text, types.String
  input_field :picture_files, types[types.String]
  input_field :picture_filename, types.String
  input_field :video_id, types.Int
  input_field :link_url, types.String
  input_field :link_title, types.String
  input_field :link_description, types.String
  input_field :link_picture_url, types.String
  input_field :parent_id, types.Int
  input_field :location, types.String

  # resolve must return a hash with these keys
  return_field :comment, CommentType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      begin
        object = inputs[:object_type].constantize.find_by(id: inputs[:object_id])
      rescue NameError => ex
        return add_custom_error("Unknown object_type '#{inputs[:object_type]}'", ctx)
      end
      if object.nil?
        add_custom_error("#{inputs[:object_type].capitalize} not found", ctx)
      elsif !object.respond_to?(:add_comment)
        add_custom_error("Instance of #{inputs[:object_type].capitalize} type cannot be commented", ctx)
      else
        normalized_inputs = normalize_input_data(inputs)
        comment = Comment.build_from(object, user.id, '')
        if comment.apply_attributes(comment_params(normalized_inputs)).errors.present?
          return_errors(comment, ctx)
        elsif comment.save
          if normalized_inputs[:parent_id].blank? # This is a root comment
            author = object.respond_to?(:user) ? object.user : object.uploader
            if author.id != user.id
              class_name = object.class.name == 'Widgets::BlogWidget::Post' ? "post" : "#{object.class.name.downcase}"
              notification_attrs = {user_id: author.id,
                                    initiator_type: 'User',
                                    initiator_id: user.id,
                                    name: "#{class_name}:commented"}
              notification_attrs.merge!(object_type: comment.class.name, object_id: comment.id) unless comment.nil?
              Notification.create(notification_attrs)
            end
          else
            comment.move_to_child_of(Comment.find_by(id: normalized_inputs[:parent_id]))
            comment.update(parent_id: normalized_inputs[:parent_id])
          end

          # Process mentions
          comment.process_mentions user.id

          object.reload

          # real-time notification
          ws_msg = {
              adapter: 'pusher',
              channel: 'global',
              event: 'comments_count_changed',
              data: {
                  message: {
                      object_type: object.class.name,
                      object_id: object.id,
                      comments_count: object.comment_threads.count,
                      location: normalized_inputs[:location],
                      username: user.username
                  }
              },
              debug_info: {
                  location: 'Comments::CreateCommentMutation',
                  object_type: object.class.name,
                  object_id: object.id,
                  user_id: user.id
              }
          }
          RealTimeNotificationJob.perform_later(ws_msg)

          {comment: comment}
        else
          add_custom_error("Failed to comment the #{inputs[:object_type].downcase}", ctx)
        end
      end

    end
  }

  def comment_params(params)
    {
        text: params[:text],
        picture_files: params[:picture_files],
        picture_filename: params[:picture_filename],
        video_id: params[:video_id],
        link_url: params[:link_url],
        link_title: params[:link_title],
        link_description: params[:link_description],
        link_picture_url: params[:link_picture_url]
    }
  end

  def result_if_error_occurred
    {comment: nil}
  end
end
