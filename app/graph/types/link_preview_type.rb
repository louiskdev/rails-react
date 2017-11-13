LinkPreviewType = GraphQL::ObjectType.define do
  name "LinkPreview"
  description "Link preview entry"

  interfaces [GraphQL::Relay::Node.interface]
  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Link preview ID"
  field :title, types.String, "Title of this link preview"
  field :description, types.String, "Short description of this link preview"
  field :url, types.String, "Url of this link preview"
  field :picture_url, types.String, "Picture url of this link preview"
end
