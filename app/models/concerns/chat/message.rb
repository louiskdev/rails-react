module Chat
  module Message
    extend ActiveSupport::Concern

    included do
      include ActionView::Helpers::SanitizeHelper

      belongs_to :user
      belongs_to :chat
      has_many   :media, as: :mediable, dependent: :destroy
      has_many   :link_previews, as: :link_previewable, dependent: :destroy

      validate :non_empty_record

      def add_picture(uploader_id, file, filename)
        picture = ::Attachments::Picture.new
        if picture.add_encoded_attachment(file, filename)
          medium = self.media.build(user_id: uploader_id, attachmentable: picture)
          medium.save
        else
          false
        end
      end

      def video_attachment
        media.where(attachmentable_type: 'Attachments::Video').first.attachmentable rescue ''
      end

      def picture_attachment
        media.where(attachmentable_type: 'Attachments::Picture').first.attachmentable rescue ''
      end

      def apply_attributes(params)
        self.text = sanitize(params[:text], tags: %w(strong b em i del ins mark s strike u))
        self.video_url = params[:video_url]
        if self.has_attribute?(:channel_id)
          self.channel_id = params[:channel_id]
        end

        # assign video
        if params[:video_id].present?
          media = Medium.find_by(id: params[:video_id], user_id: self.user_id)
          if media.nil?
            self.errors[:base] << 'Video is not found'
          else
            self.media << media
          end

          # assign picture
        elsif params[:picture_file].present? and params[:picture_file].is_a?(String)
          if params[:picture_file] =~ /\Adata:image\/\w+;base64,.+/
            unless self.add_picture(self.user_id, params[:picture_file], params[:picture_filename])
              self.errors[:base] << 'File is not valid'
            end
          elsif File.exist?("#{Rails.root}/public#{params[:picture_file]}")
            picture = ::Attachments::Picture.new
            File.open("#{Rails.root}/public#{params[:picture_file]}") do |f|
              picture.file = f
            end
            medium = self.media.build(user_id: self.user_id, attachmentable: picture)
            # medium.save
          elsif params[:picture_file] =~ /\Ahttps?:\/\/.*\.(#{PictureUploader.new.extension_white_list.join('|')})\z/
            picture = ::Attachments::Picture.new(remote_file_url: params[:picture_file])
            medium = self.media.build(user_id: self.user_id, attachmentable: picture) if picture.valid?
            # medium.save
          else
            self.errors[:base] << "Argument 'picture_file' contains invalid url"
          end
        end

        # assign link preview data
        if params[:link_url].present?
          link_preview_attrs = {url: params[:link_url], title: params[:link_title], description: params[:link_description], picture_url: params[:link_picture_url]}
          self.link_previews.build(link_preview_attrs)
        end

        self
      end

      def to_hash
        message = {}
        message[:id] = self.id
        message[:text] = self.text
        message[:created_at] = self.created_at.iso8601

        if self.has_attribute?(:channel_id)
          message[:channel_id] = self.channel_id;
        end

        if user.nil?
          message[:author] = ''
        else
          message[:author] = {}
          message[:author][:first_name] = user.first_name
          message[:author][:username] = user.username
          message[:author][:thumb_avatar_url] = user.avatar_url(:thumb)
        end

        medium = self.media.first
        if medium.nil?
          message[:media] = ''
        else
          message[:media] = {}
          message[:media][:id] = medium.id
          message[:media][:type] = medium.type
          message[:media][:thumb_url] = medium.thumb_url
          message[:media][:picture_url] = picture_attachment.file_url rescue ''
          message[:media][:video_links] = video_attachment.links rescue []
          message[:media][:recoding_job_key] = video_attachment.recoding_job_key rescue ''
        end

        link_preview = self.link_previews.first
        if link_preview.nil?
          message[:link_preview] = ''
        else
          message[:link_preview] = {}
          message[:link_preview][:url] = link_preview.url
          message[:link_preview][:title] = link_preview.title
          message[:link_preview][:description] = link_preview.description
          message[:link_preview][:picture_url] = link_preview.picture_url
        end

        message
      end

      private
      def non_empty_record
        if text.blank? and video_url.blank? and media.blank? and link_previews.blank?
          errors.add(:message, 'cannot be empty')
        end
      end
    end

  end
end
