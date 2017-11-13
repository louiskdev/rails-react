Admin::AdminUserInfoType = GraphQL::ObjectType.define do
  name "adminUserInfo"
  description I18n.t('graphql.admin_user_info_type.type_description')

  field :success, !types.Boolean, I18n.t('graphql.admin_user_info_type.success')
  field :totalUsers, types.Int, I18n.t('graphql.admin_user_info_type.totalUsers')
  field :averageSessionTime, types.Int, I18n.t('graphql.admin_user_info_type.averageSessionTime')

end
