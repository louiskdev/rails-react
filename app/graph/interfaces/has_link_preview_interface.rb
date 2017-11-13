HasLinkPreviewInterface = GraphQL::InterfaceType.define do
  name "HasLinkPreviewInterface"
  description "provide link preview data"

  field :link_preview, -> { LinkPreviewType }, "Link preview entry" do
    resolve -> (obj, args, ctx) { obj.link_previews.first }
  end
end
