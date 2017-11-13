HashtagType = GraphQL::ObjectType.define do
  name "Hashtag"
  description "Hashtag entry"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "#hashtag ID"
  field :name, types.String, "The name of this #hashtag"
  field :posts_count, types.Int, "The number of mentions of this #hashtag"

end
