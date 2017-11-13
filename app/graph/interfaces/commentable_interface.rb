TempCommentRelatedInformationResult = Struct.new(:target, :target_siblings, :parent, :parent_siblings, :children)

CommentableInterface = GraphQL::InterfaceType.define do
  name "CommentableInterface"
  description "The object implementing this interface can be commented"

  field :comments_count, types.String, "Number of comments for this object" do
    resolve -> (obj, args, ctx) { obj.comment_threads.count }
  end

  connection :comments, -> { CommentType.connection_type }, 'Associated root comments' do
    resolve -> (obj, args, ctx) do
      # obj.class.find_comments_for(obj)
      obj.root_comments.order(:created_at)
    end
  end

  field :comment_related_data, -> { CommentRelatedDataType }, '' do
    argument :target_comment_id, !types.Int
    argument :limit, types.Int, '', default_value: 10

    resolve -> (obj, args, ctx) do
      target = Comment.find_by(id: args[:target_comment_id])
      return nil if target.nil?

      limit = args[:limit]
      target_siblings = obj.comment_threads.where(parent_id: target.parent_id).where('created_at < ?', target.created_at).order(:created_at).last(limit)
      parent = target.parent rescue nil
      parent_siblings = parent.nil? ? [] : obj.root_comments.where('created_at < ?', parent.created_at).order(:created_at).last(limit)
      children = target.children.order(:created_at).last(limit)

      result = TempCommentRelatedInformationResult.new(target, target_siblings, parent, parent_siblings,  children)
      result
    end
  end

  field :root_comment, -> { CommentType }, '' do
    resolve -> (obj, args, ctx) do
      return nil if ctx[:target_comment_id].blank?

      comment = Comment.find_by(id: ctx[:target_comment_id])
      return nil if comment.nil?

      result = comment.parent_id.nil? ? comment : comment.parent
      result
    end
  end
end
