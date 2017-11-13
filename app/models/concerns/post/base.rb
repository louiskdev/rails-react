module Post
  module Base
    extend ActiveSupport::Concern

    included do
      include ActionView::Helpers::SanitizeHelper
      include MediaProcessing
      include RatingProcessing

      acts_as_likeable
      acts_as_commentable

      belongs_to :user
      has_many   :media, as: :mediable, dependent: :destroy
      has_many   :visits, as: :visitable, dependent: :destroy
      has_many   :activities, as: :object
      has_many   :link_previews, as: :link_previewable, dependent: :destroy

      validate :non_empty_record
      after_create :add_author_visit
      after_destroy :remove_associated_notifications

      def video_attachment
        media.where(attachmentable_type: 'Attachments::Video').first.attachmentable rescue nil
      end

      def picture_attachment
        media.where(attachmentable_type: 'Attachments::Picture').first.attachmentable rescue nil
      end

      def apply_post_attributes(options)
        # apply text
        self.text = sanitize(options[:text], tags: %w(strong b em i del ins mark s strike u))

        # apply title
        self.title = sanitize(options[:title], tags: %w(strong b em i del ins mark s strike u)) if options[:title].present?

        # apply pictures and videos
        self.assign_media_files(options[:picture_files], options[:video_id])

        # destroy old link_preview objects
        self.link_previews.destroy_all unless self.link_previews.blank?

        # apply link preview entry
        if options[:link_url].present?
          link_preview_attrs = { url: options[:link_url],
                                 title: options[:link_title],
                                 description: options[:link_description],
                                 picture_url: options[:link_picture_url] }
          self.link_previews.build(link_preview_attrs)
        end

        self
      end

      private

      def non_empty_record
        if media.blank? and text.blank? and link_previews.blank?
          errors.add(:base, 'Record should have text and/or media file')
        end
      end

      def add_author_visit
        if self.user_id.present? and self.user.present?
          self.visits.create(user_id: self.user_id)
        end
      end

      def remove_associated_notifications
        BackgroundJob.perform_later(self.class.name, 'remove_associated_notifications_bg', self.id)
      end

      def self.remove_associated_notifications_bg(object_id)
        ids = Activity.where(object_type: self.name, object_id: object_id).ids
        Notification.destroy_all(object_type: 'Activity', object_id: ids)
      end

    end

  end
end
