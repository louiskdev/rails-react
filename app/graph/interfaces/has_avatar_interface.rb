HasAvatarInterface = GraphQL::InterfaceType.define do
  name "HasAvatarInterface"
  description "provide avatar url"

  field :avatar_url, !types.String, "Avatar url" do
    argument :version, types.String
    resolve -> (obj, args, ctx) { obj.avatar_url(args["version"]) }
  end
end
