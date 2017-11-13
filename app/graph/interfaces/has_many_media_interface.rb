HasManyMediaInterface = GraphQL::InterfaceType.define do
  name "HasManyMediaInterface"
  description "get associated media objects"

  connection :media, -> { MediumType.connection_type }, "Associated media objects" do
    resolve -> (obj, args, ctx) { obj.media }
  end
end
