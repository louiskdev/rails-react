CommentObjectUnion = GraphQL::UnionType.define do
  name "CommentObject"
  description "Objects that can be associated to Comment entity"
  possible_types [MediumType, NoteType, Widgets::BlogWidget::PostType]
end
