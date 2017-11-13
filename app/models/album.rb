class Album < ActiveRecord::Base
  include RatingProcessing

  acts_as_likeable
  acts_as_commentable

  enum privacy: [:p_public, :p_private]

  belongs_to :gallery, class_name: 'Widgets::GalleryWidget::Gallery'
  has_many :media, dependent: :destroy
  has_one :avatar, as: :avatarable, dependent: :destroy
  belongs_to :user
  has_many :visits, as: :visitable, dependent: :destroy

  after_create :log_activity_creating
  after_destroy :hide_all_activities

  validates :name, presence: true
  validates :privacy, presence: true

  # default_scope { includes(:media) }

  def avatar_url(version=nil)
    if avatar.present?
      avatar.picture_url(version)
    elsif media.first.present? and !media.first.thumb_url.empty?
      media.first.thumb_url
    else
      Avatar.new.picture_url(version)
    end
  end

  private

  def log_activity_creating
    user = self.user

    if self.gallery_id.nil?
      activity_data = {name: 'albums.create', privacy: Activity.privacies[:p_private]}
    else
      bubble = self.gallery.bubble
      if bubble.present?
        activity_data = { name: 'galleries.create_album',
                          privacy: bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public],
                          bubble_id: bubble.id
        }
      else
        Bugsnag.notify(RuntimeError.new('Seems like this gallery has\'nt associated bubble.'), {
                       location: 'Album#log_activity_creating',
                       album_id: self.id,
                       gallery_id: self.gallery_id,
                       user_id: user.id,
                       username: user.username })
        return
      end
    end

    Activity.create(activity_data.merge({ user_id: user.id,
                                          user_ip: user.current_sign_in_ip,
                                          object_id: self.id,
                                          object_type: self.class.name,
                                          feed: true,
                                          extra_data: {
                                            name: self.name
                                          }})
    )
  end

  def hide_all_activities
    # hide all associated activities
    Activity.where(object_id: self.id, object_type: self.class.name, feed: true).update_all(feed: false)
  end
end
