InterestType = GraphQL::ObjectType.define do
  name "Interest"
  description "Interest entry"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Interest ID"
  field :name, types.String, "Name of this interest"
  field :counter, types.Int, "Interest's usage frequency"
end
