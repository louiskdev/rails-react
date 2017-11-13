BubbleCountersDataType = GraphQL::ObjectType.define do
  name "BubbleCountersData"
  description I18n.t('graphql.bubble_counters_data_type.type_description')

  # Expose fields from the model
  field :feed_unread_items_count, !types.Int, I18n.t('graphql.bubble_counters_data_type.feed_unread_items_count')
  field :blog_unread_items_count, !types.Int, I18n.t('graphql.bubble_counters_data_type.blog_unread_items_count')
  field :chat_unread_items_count, !types.Int, I18n.t('graphql.bubble_counters_data_type.chat_unread_items_count')
  field :gallery_unread_items_count, !types.Int, I18n.t('graphql.bubble_counters_data_type.gallery_unread_items_count')
  field :events_unread_items_count, !types.Int, I18n.t('graphql.bubble_counters_data_type.events_unread_items_count')
  field :total_unread_items_count, !types.Int, I18n.t('graphql.bubble_counters_data_type.total_unread_items_count')
end
