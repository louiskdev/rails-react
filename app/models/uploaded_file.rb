class UploadedFile < ActiveRecord::Base
  mount_uploader :file, FileUploader

  belongs_to :bubble
  belongs_to :user, foreign_key: :owner_id

end
