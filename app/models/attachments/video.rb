module Attachments
  class Video < ActiveRecord::Base
    mount_uploader :file, VideoUploader

    has_one :medium, as: :attachmentable
    validates :file, presence: true

    def self.table_name_prefix
      'attachment_'
    end

    def links
      [file.mp4_url, file.webm_url, file.ogv_url]
    end

    def thumbnail(version='thumb')
      file.send("#{version}_url")
    end
  end
end
