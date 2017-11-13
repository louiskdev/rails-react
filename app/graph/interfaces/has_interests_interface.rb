HasInterestsInterface = GraphQL::InterfaceType.define do
  name "HasInterestsInterface"
  description "provide interests list and count"

  field :interests_count, !types.Int, "Number of interests"
  connection :interests, InterestType.connection_type, "List of interests" do
    resolve -> (obj, args, ctx) { obj.interests }
  end
end
