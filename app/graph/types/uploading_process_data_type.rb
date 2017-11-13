UploadingProcessDataType = GraphQL::ObjectType.define do
  name "UploadingProcessData"
  description I18n.t('graphql.uploading_process_data_type.type_description')

  interfaces [HasMediumInterface]

  # Expose fields from the model
  field :state, !types.String, I18n.t('graphql.uploading_process_data_type.state')
  field :progress, !types.Int, I18n.t('graphql.uploading_process_data_type.progress')
end
