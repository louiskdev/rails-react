module Attachments
  class Picture < ActiveRecord::Base
    mount_uploader :file, PictureUploader

    has_one :medium, as: :attachmentable
    validates :file, presence: true

    def self.table_name_prefix
      'attachment_'
    end

    def add_encoded_attachment(encoded_string, file_name=nil)
      description, encoded_bytes = encoded_string.split(',')
      return false unless encoded_bytes

      # ensure file_name
      if file_name.nil?
        _, file_format = parse_attachment_description(description)
        file_name = "temp-#{Time.now.to_f}.#{file_format}"
      end

      tempfile = "#{Rails.root}/tmp/#{file_name}"
      bytes = Base64.decode64(encoded_bytes)
      # save temp file
      File.open(tempfile, 'wb') do |f|
        f.write(bytes)
      end
      # save curriervawe attachment for temp file
      File.open(tempfile) do |f|
        self.file = f
      end
      # delete temp file
      File.delete(tempfile)
      self.file.present?
    end

    private

    def parse_attachment_description(description)
      regex = /\Adata:(\w+)\/(\w+);base64\z/
      [regex.match(description).try(:[], 1), regex.match(description).try(:[], 2)]
    end

  end
end
