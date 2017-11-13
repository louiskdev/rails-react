UploadedFileType = GraphQL::ObjectType.define do
  name "UploadedFile"
  description "Uploaded file data"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Event ID"
  field :owner_id, types.Int, "ID of owner user"
  field :bubble_id, types.Int, "ID of owning bubble"
  field :url, types.String, "File url"
  field :downloads, types.Int, "Number of file downloads"
  field :created_at, types.String, "Date and time that this file was uploaded"
  field :content_type, types.String, "MIME type of the file"
  field :size, types.Int, "File size in bytes"

  field :filename, types.String, I18n.t('File name') do
    resolve -> (file, args, ctx) { file.file_identifier }
  end

  field :uploader, -> { UserType }, "Uploaded user" do
    resolve -> (file, args, ctx) { file.user }
  end
  field :bubble, -> { BubbleType }, "Uploaded bubble" do
    resolve -> (file, args, ctx) { file.bubble }
  end
  
end
