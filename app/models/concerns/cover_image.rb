module CoverImage
  extend ActiveSupport::Concern

  included do
    mount_uploader :cover_image, CoverImageUploader

    def apply_cover_image(encoded_string, file_name='')
      return false if encoded_string.blank?

      tmp_file = decode_attachment(encoded_string, file_name)
      if tmp_file
        if File.extname(tmp_file).downcase == '.gif' and self.crop_params.present?
          system "convert #{tmp_file} -coalesce -repage 0x0 -rotate #{self.rotation_angle} -crop #{self.crop_params} +repage #{tmp_file}"
        end
        # save curriervawe attachment for temp file
        File.open(tmp_file) do |f|
          self.cover_image = f
        end
        # delete temp file
        File.delete(tmp_file)
      end

      self.cover_image.present?
    end

  end
end
