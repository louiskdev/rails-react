field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'rootCommentsForObject'
  type Connections::CommentsWithTotalCountConnectionType
  description 'Get root comments of object and comments total count'

  argument :object_type, !types.String
  argument :object_id, !types.Int
  argument :targeted_comment_id, types.Int

  resolve -> (obj, args, ctx) {
    user = ctx[:current_user]
    result = []

    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      begin
        object = normalized_args[:object_type].constantize.find_by(id: normalized_args[:object_id])
      rescue NameError => ex
        return custom_error("Unknown object_type '#{normalized_args[:object_type]}'", ctx)
      end
      if object.nil?
        add_custom_error("#{normalized_args[:object_type]} not found", ctx)
      elsif !object.respond_to?(:root_comments)
        add_custom_error("Instance of #{normalized_args[:object_type]} type cannot be commented", ctx)
      elsif !user.can_view?(object)
        add_custom_error("#{normalized_args[:object_type]} not found", ctx)
      elsif normalized_args[:targeted_comment_id].present?
        target = Comment.find_by(id: normalized_args[:targeted_comment_id])
        return custom_error('Comment not found', ctx) if target.nil?

        result = if target.parent_id.blank?  # This is a root comment
                   object.root_comments.where('created_at >= ?', target.created_at).order(:created_at)
                 else
                   ctx[:targeted_comment_created_at] = target.created_at
                   Comment.where(id: target.parent_id)
                 end
      else
        result = object.root_comments.order(:created_at)
      end

      result
    end
  }

  def result_if_error_occurred
    []
  end

end

Comments::RootCommentsForObjectField = GraphQL::Relay::ConnectionField.create(field)
