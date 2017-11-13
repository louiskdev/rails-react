HasMediumInterface = GraphQL::InterfaceType.define do
  name "HasMediumInterface"
  description "get associated media object"

  field :medium, -> { MediumType }, "Associated media object" do
    resolve -> (obj, args, ctx) { obj.media.last }
  end
end
