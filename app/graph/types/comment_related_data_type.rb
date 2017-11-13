CommentRelatedDataType = GraphQL::ObjectType.define do
  name "CommentRelatedData"
  description I18n.t('graphql.comment_related_data_type.type_description')

  # Expose fields from the model
  field :target, -> { CommentType }, I18n.t('graphql.comment_related_data_type.target')
  field :target_siblings, -> { types[CommentType] }, I18n.t('graphql.comment_related_data_type.target_siblings')
  field :parent, -> { CommentType }, I18n.t('graphql.comment_related_data_type.parent')
  field :parent_siblings, -> { types[CommentType] }, I18n.t('graphql.comment_related_data_type.parent_siblings')
  field :children, -> { types[CommentType] }, I18n.t('graphql.comment_related_data_type.children')
end
