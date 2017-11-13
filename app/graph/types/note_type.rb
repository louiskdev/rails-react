NoteType = GraphQL::ObjectType.define do
  name "Note"
  description "Note (a post user creates on dashboard) entry"

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
  field :id, !types.ID,  "Note ID"
  field :private, types.Boolean, "Privacy flag of this note"

end
