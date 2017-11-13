ActivityObjectUnion = GraphQL::UnionType.define do
  name "ActivityObject"
  description "Objects that can be associated to Activity entity"
  possible_types [NoteType, MediumType, AlbumType, BubbleType, Widgets::BlogWidget::PostType]
end
