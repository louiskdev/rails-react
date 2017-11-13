Widgets::BlogWidget::PostType = GraphQL::ObjectType.define do
  name "Post"
  description "A blog post entry"

  interfaces [GraphQL::Relay::Node.interface,
              PostInterface,
              HasAuthorInterface,
              HasLinkPreviewInterface,
              HasMediumInterface,
              HasManyMediaInterface,
              LikeableInterface,
              VisitableInterface,
              CommentableInterface,
              RatingableInterface
             ]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "The ID of this post"
  field :title, !types.String, "The title of this post"
  field :blog_id, !types.Int, "The ID of associated blog entry"

end
