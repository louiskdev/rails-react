Connections::CommentsWithTotalCountConnectionType = CommentType.define_connection do
  name 'CommentsWithTotalCountConnection'

  field :total_count do
    type !types.Int
    # `obj` is the Connection
    resolve -> (obj, args, ctx) {
      comment = obj.nodes.first
      if comment.nil?
        0
      else
        comment.commentable.comment_threads.count rescue 0
      end
    }
  end
end
