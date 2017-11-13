HiddenPostsCountType = GraphQL::ObjectType.define do
  name "HiddenPostsCount"
  description I18n.t('graphql.hidden_posts_count_type.type_description')

  # Expose fields from the model
  field :count, !types.Int, I18n.t('graphql.hidden_posts_count_type.count')
end
