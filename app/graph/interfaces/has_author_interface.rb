HasAuthorInterface = GraphQL::InterfaceType.define do
  name "HasAuthorInterface"
  description "provide author entity"

  field :user_id, types.Int, "Author ID"
  field :author, -> { UserType }, "Author entry" do
    resolve -> (obj, args, ctx) { obj.respond_to?(:user) ? obj.user : obj.uploader }
  end
end
