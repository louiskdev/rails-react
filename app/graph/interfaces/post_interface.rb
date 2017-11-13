PostInterface = GraphQL::InterfaceType.define do
  name "PostInterface"
  description "provide basic post fields"

  field :text, types.String, "Text of this object"
  field :created_at, types.String, "Object creation date"
  field :updated_at, types.String, "The latest modification date of this object"
  field :trimmed_text, types.String, "Trimmed text version of this object" do
    argument :limit, types.Int
    resolve -> (note, args, ctx) do
      return nil if note.text.nil?
      limit = args[:limit] || 400
      note.text.length > limit ? note.text.truncate(limit) : ''
    end
  end

  # TODO has attachment

end
