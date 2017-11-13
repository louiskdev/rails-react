module ImageProcessing
  extend ActiveSupport::Concern

  included do
    attr_accessor :crop_x, :crop_y, :crop_w, :crop_h, :rotation_angle

    def crop_h
      int = Integer(@crop_h)
      int <= 0 ? nil : int
    rescue
      nil
    end

    def crop_w
      int = Integer(@crop_w)
      int <= 0 ? nil : int
    rescue
      nil
    end

    def crop_x
      int = Integer(@crop_x)
      int < 0 ? 0 : int
    rescue
      nil
    end

    def crop_y
      int = Integer(@crop_y)
      int < 0 ? 0 : int
    rescue
      nil
    end

    def crop_params
      if self.crop_h.present? and self.crop_w.present? and self.crop_x.present? and self.crop_y.present?
        "#{self.crop_w}x#{self.crop_h}+#{self.crop_x}+#{self.crop_y}"
      else
        nil
      end
    end

    def rotation_angle
      Integer(@rotation_angle) rescue 0
    end

    private

    def decode_attachment(encoded_string, file_name)
      description, encoded_bytes = encoded_string.split(',')
      return false unless encoded_bytes

      # ensure file_name
      file_name = "temp-#{Time.now.to_f}" if file_name.blank?

      file_type, file_format = parse_attachment_description(description)
      # rm file extension if filename includes it
      file_name.sub!(/\.#{file_format}\z/i, '')
      bytes = Base64.decode64(encoded_bytes)

      tempfile = "#{Rails.root}/tmp/#{file_name}.#{file_format}"
      # save temp file
      File.open(tempfile, 'wb') do |f|
        f.write(bytes)
      end

      tempfile
    end

    def parse_attachment_description(description)
      regex = /\Adata:(\w+)\/(\w+);base64\z/
      [regex.match(description).try(:[], 1), regex.match(description).try(:[], 2)]
    end

  end

end
