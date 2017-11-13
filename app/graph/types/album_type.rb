AlbumType = GraphQL::ObjectType.define do
  name "Album"
  description "Album entry"

  interfaces [GraphQL::Relay::Node.interface,
              HasAvatarInterface,
              LikeableInterface,
              VisitableInterface,
              CommentableInterface,
              RatingableInterface
  ]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Album ID"
  field :name, types.String, "The name of this album"
  field :description, types.String, "Description of this album"
  field :user_id, types.String, "Owner ID"
  field :owner, -> { UserType }, "Owner entity" do
    resolve -> (album, args, ctx) { album.user }
  end
  field :gallery_id, types.String, "Gallery ID"
  field :created_at, types.String, "Creation date of this album"
  field :updated_at, types.String, "The latest modification date of this album"
  field :privacy, types.String, "Privacy of this album" do
    resolve -> (album, args, ctx) { album.privacy[/\Ap_(.+)/, 1] }
  end
  field :media_count, !types.Int, 'Number of associated media files' do
    resolve -> (album, args, ctx) { album.media.count }
  end

  connection :media, -> { MediumType.connection_type }, "Media list of this album"

end
