Admin::AdminBubbleInfoType = GraphQL::ObjectType.define do
  name "adminBubbleInfo"
  description I18n.t('graphql.admin_bubble_info_type.type_description')

  field :success, !types.Boolean, I18n.t('graphql.admin_bubble_info_type.success')
  field :bubbleCreateCount, types.Int, I18n.t('graphql.admin_bubble_info_type.bubbleCreateCount')
  field :bubbleJoinCount, types.Int, I18n.t('graphql.admin_bubble_info_type.bubbleJoinCount')
  field :totalPrivateBubbles, types.Int, I18n.t('graphql.admin_bubble_info_type.bubbleCreateCount')
  field :totalPublicBubbles, types.Int, I18n.t('graphql.admin_bubble_info_type.bubbleJoinCount')

end
