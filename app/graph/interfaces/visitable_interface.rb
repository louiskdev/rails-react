VisitableInterface = GraphQL::InterfaceType.define do
  name "VisitableInterface"
  description "The object implementing this interface can be visited"

  field :visits_count, types.String, "Number of people who viewed this object" do
    resolve -> (obj, args, ctx) { obj.visits.count }
  end
end
