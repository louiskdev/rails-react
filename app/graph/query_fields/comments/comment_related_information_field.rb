CommentRelatedDataResult = Struct.new(:original, :o_post, :o_medium, :o_note)

Comments::CommentRelatedInformationField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name 'commentRelatedInformation'
  type TempCommentRelatedInformationType
  # type CommentObjectUnion
  description I18n.t('graphql.queries.commentRelatedInformation.description')

  argument :id, !types.Int, I18n.t('graphql.queries.commentRelatedInformation.args.id')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      comment = Comment.find_by(id: args[:id])
      return custom_error('Comment not found', ctx) if comment.nil?

      object = comment.commentable rescue nil
      return custom_error('Comment related object not found', ctx) if object.nil? or !user.can_view?(object)

      ctx[:target_comment_id] = comment.id

      result = CommentRelatedDataResult.new(object)
      case object.class.name
        when 'Widgets::BlogWidget::Post' then result[:o_post] = object
        when 'Note' then result[:o_note] = object
        when 'Medium' then result[:o_medium] = object
      end

      result
    end
  end

  def result_if_error_occurred
    nil
  end

end
