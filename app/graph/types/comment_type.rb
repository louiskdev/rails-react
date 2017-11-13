CommentType = GraphQL::ObjectType.define do
  name "Comment"
  description "Comment entry"

  interfaces [GraphQL::Relay::Node.interface,
              LikeableInterface,
              HasAuthorInterface,
              HasLinkPreviewInterface,
              HasMediumInterface,
              HasManyMediaInterface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Comment ID"
  field :title, types.String, "Title of this comment"
  field :subject, types.String, "Subject of this comment"
  field :text, types.String, "Text of this comment", property: :body
  field :body, types.String, "Alias for the text field"
  field :parent_id, types.Int, "Parent comment ID"
  field :created_at, types.String, "Creation date of this comment"
  field :commentable_type, !types.String, "Type of the associated object"
  field :commentable_id, !types.Int, "Associated object ID"

  field :commentable, CommentObjectUnion, "Wrapped object entity" do
    resolve -> (comment, args, ctx) { comment.commentable }
  end

  connection :comments, -> { CommentType.connection_type }, "Children comments list" do
    resolve -> (comment, args, ctx) do
      result = comment.children
      result = result.where('created_at >= ?', ctx[:targeted_comment_created_at]) if ctx[:targeted_comment_created_at].present?
      result
    end
  end
end
