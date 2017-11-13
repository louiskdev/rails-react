Admin::AdminZipCodesType = GraphQL::ObjectType.define do
  name "adminZipCodes"
  description I18n.t('graphql.admin_zip_code_type.type_description')

  field :success, !types.Boolean, I18n.t('graphql.admin_zip_code_type.success')
  connection :zip_codes, types.String.connection_type, I18n.t('graphql.admin_zip_code_type.zip_codes')
end
