MediumObjectUnion = GraphQL::UnionType.define do
  name "MediumObject"
  description "Objects that can be associated to Medium entity"
  possible_types [NoteType, Widgets::BlogWidget::PostType]
end
