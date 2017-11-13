
Schema = GraphQL::Schema.define do
  query QueryType
  mutation MutationType
  # max_complexity 100
  # rescue_from(ActiveRecord::RecordNotFound) { |err| "..." }
  # Types was renamed to `orphan_types` to avoid conflict with the `types` helper
  # orphan_types [ExtraType, OtherType]

  # based on `obj` and `ctx`,
  # figure out which GraphQL type to use and return the type
  resolve_type -> (obj, ctx) do
    Object.const_get("#{obj.class.name}Type")
  end

  # Fetch an object by UUID
  object_from_id ->(id, ctx) do
    # Break the id into its parts:
    type_name, id = GraphQL::Schema::UniqueWithinType.decode(id)
    # Fetch the identified object: "Post" -> Post.find(id)
    Object.const_get(type_name).find(id)
  end

  # Generate a UUID for this object
  id_from_object ->(obj, type_defn, ctx) do
    # Provide the type name & the object's `id`:
    GraphQL::Schema::UniqueWithinType.encode(type_defn.name, obj.id)
  end
end