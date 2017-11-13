TempCommentRelatedInformationType = GraphQL::ObjectType.define do
  name "TempCommentRelatedInformation"
  description 'Remove me after Apollo upgrade'

  # Expose fields from the model
  field :original, -> { CommentObjectUnion }
  field :o_post, -> { Widgets::BlogWidget::PostType }
  field :o_medium, -> { MediumType }
  field :o_note, -> { NoteType }
end
