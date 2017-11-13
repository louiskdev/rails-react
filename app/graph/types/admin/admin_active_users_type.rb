Admin::AdminActiveUsersType = GraphQL::ObjectType.define do
  name "adminActiveUsers"
  description I18n.t('graphql.adminActiveUsers.type_description')

  field :success, !types.Boolean, I18n.t('graphql.adminActiveUsers.success')
  field :activeUsers, types.Int, I18n.t('graphql.adminActiveUsers.activeUsers')

end
