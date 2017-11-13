class Comment < ActiveRecord::Base
  include ActionView::Helpers::SanitizeHelper
  include Mention
  include MediaProcessing
  acts_as_likeable
  acts_as_nested_set :scope => [:commentable_id, :commentable_type], dependent: :destroy

  validates :user, presence: true
  validates :commentable_id, presence: true
  validates :commentable_type, presence: true
  validate  :non_empty_record

  belongs_to :commentable, :polymorphic => true
  belongs_to :user
  has_many   :link_previews, as: :link_previewable, dependent: :destroy
  has_many   :media, as: :mediable, dependent: :destroy

  attr_accessor :actor

  after_save :notify_author_of_parent_comment
  after_destroy :notify_comment_destroyed
  after_destroy :remove_related_notifications
  after_destroy :log_activity_destroying

  # Helper class method to lookup all comments assigned
  # to all commentable types for a given user.
  scope :find_comments_by_user, lambda { |user| where(:user_id => user.id).order('created_at DESC') }

  # Helper class method to look up all comments for
  # commentable class name and commentable id.
  scope :find_comments_for_commentable,
        lambda { |commentable_str, commentable_id|
          where(:commentable_type => commentable_str.to_s, :commentable_id => commentable_id).order('created_at DESC')
        }

  # Helper class method that allows you to build a comment
  # by passing a commentable object, a user_id, and comment text
  # example in readme
  def self.build_from(obj, user_id, comment)
    new \
      :commentable => obj,
      :body        => comment,
      :user_id     => user_id
  end

  # Helper class method to look up a commentable object
  # given the commentable class name and id
  def self.find_commentable(commentable_str, commentable_id)
    commentable_str.constantize.find(commentable_id)
  end

  #helper method to check if a comment has children
  def has_children?
    self.children.any?
  end

  # Helper method to give process_mentions method content of comment
  def mentioning_text
    self.body
  end

  def apply_attributes(options)
    # apply text
    self.body = sanitize(options[:text], tags: %w(strong b em i del ins mark s strike u))

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
    if media.blank? and body.blank? and link_previews.blank?
      errors.add(:base, 'Record should have text and/or media file')
    end
  end

  def notify_author_of_parent_comment
    parent_comment = Comment.find_by(id: self.parent_id)
    unless parent_comment.nil?
      parent_comment_author_id = parent_comment.user.try(:id)
      if parent_comment_author_id != self.user_id
        notification_attrs = {user_id: parent_comment.user.try(:id),
                              initiator_type: 'User',
                              initiator_id: self.user_id,
                              name: "comments:reply"}
        notification_attrs.merge!(object_type: self.class.name, object_id: self.id)
        Notification.create(notification_attrs)
      end
    end
  end

  def notify_comment_destroyed
    object = self.commentable

    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'comment_removed',
        data: {
            message: {
                comment_id: self.id,
                object_type: object.class.name,
                object_id: object.id
            }
        },
        debug_info: {
            location: 'Comment#notify_comment_destroyed',
            object_type: object.class.name,
            object_id: object.id,
            user_id: self.actor.try(:id)
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def remove_related_notifications
    Notification.destroy_all(object_type: self.class.name, object_id: self.id)
  end

  def log_activity_destroying
    Activity.create(name: "comments.destroy", user_id: actor.try(:id), user_ip: actor.try(:current_sign_in_ip), feed: false,
                    object_id: self.id, object_type: self.class.name, privacy: Activity.privacies[:p_private])
  end
end
