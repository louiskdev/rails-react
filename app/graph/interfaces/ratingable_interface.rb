RatingableInterface = GraphQL::InterfaceType.define do
  name "RatingableInterface"
  description "The object implementing this interface can be rated"

  field :rating, types.Float, "Average rating of the object" do
    resolve -> (obj, args, ctx) { obj.rating }
  end
  field :raters_count, types.Int, "Number of people who rated this object" do
    resolve -> (obj, args, ctx) { obj.ratings.count }
  end
  field :user_rating, types.Int, "Object value rated by the current user" do
    resolve -> (obj, args, ctx) { ctx[:current_user].present? ? obj.rating_from(ctx[:current_user]) : nil }
  end

end
