module MediaProcessing
  extend ActiveSupport::Concern

  included do

    def add_picture(uploader_id, file, filename=nil)
      picture = ::Attachments::Picture.new
      if picture.add_encoded_attachment(file, filename)
        medium = self.media.build(user_id: uploader_id, attachmentable: picture)
        medium.save
      else
        false
      end
    end

    def assign_media_files(pictures, video_id)
      obj = self

      # apply video
      if video_id.present?
        media = obj.user.try(:media).try(:find_by, id: video_id)
        if media.nil?
          obj.errors[:base] << 'Video file not found'
        else
          obj.media << media
        end

      # apply pictures
      elsif pictures.present? and pictures.is_a?(Array)
        pictures.each do |pic|
          next unless pic.is_a?(String)

          if pic =~ /\Adata:image\/\w+;base64,.+/
            status = obj.add_picture(obj.user_id, pic)
            obj.errors[:base] << 'Picture is invalid' unless status
          elsif File.exist?("#{Rails.root}/public#{pic}")
            picture = ::Attachments::Picture.new
            File.open("#{Rails.root}/public#{pic}") { |f| picture.file = f }
            obj.media.build(user_id: obj.user_id, attachmentable: picture)
          elsif pic =~ /\Ahttps?:\/\/.*\.(#{PictureUploader.new.extension_white_list.join('|')})\z/
            picture = ::Attachments::Picture.new(remote_file_url: pic)
            if picture.valid?
              obj.media.build(user_id: obj.user_id, attachmentable: picture)
            else
              obj.errors[:base] << 'Picture is invalid'
            end
          else
            obj.errors[:base] << "Parameter 'picture_files' contains invalid values"
          end
        end
      end
    end

  end
end
