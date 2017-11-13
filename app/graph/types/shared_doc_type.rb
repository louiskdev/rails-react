SharedDocType = GraphQL::ObjectType.define do
  name "SharedDoc"
  description "Shared document"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Event ID"
  field :owner_id, !types.Int, "Owner ID"
  field :bubble_id, !types.Int, "Bubble ID"
  field :title, types.String, "Document title"
  field :created_at, types.String, "Created date/time"
  field :updated_at, types.String, "Updated date/time"

  field :content, types.String, "Document content" do
    resolve -> (doc, args, ctx) { doc.content }
  end

  field :owner, -> { UserType }, "Owner of this document" do
    resolve -> (doc, args, ctx) { doc.user }
  end

  field :bubble, -> { BubbleType }, "Bubble that the document is created in" do
    resolve -> (doc, args, ctx) { doc.bubble }
  end

end
