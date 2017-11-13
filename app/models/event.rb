class Event < ActiveRecord::Base
  include ImageProcessing
  include CoverImage

  PERMALINK_LENGTH = 8

  acts_as_likeable

  belongs_to :events, class_name: 'Widgets::EventsWidget::Events', foreign_key: :events_id
  has_many :event_members, dependent: :destroy, counter_cache: :members_count
  has_many :members, through: :event_members
  has_one :avatar, as: :avatarable, dependent: :destroy

  after_initialize :generate_permalink
  after_create :log_activity_creating
  after_update :log_activity_updating

  validates :name,
            presence: true,
            uniqueness: true
  validates :permalink,
            presence: true,
            uniqueness: true

  def owner
    self.members.joins(:event_members).where("event_members.user_role = #{EventMember.user_roles[:owner]}").first
  end

  def avatar_url(version=nil)
    if avatar.present?
      avatar.picture_url(version)
    else
      Avatar.new.picture_url(version)
    end
  end

  def apply_avatar(image, filename, user_id, options={})
    attrs = {kind: :common, user_id: user_id}
    attrs.merge!(options) unless options.blank?

    avatar = self.build_avatar(attrs)
    if avatar.add_picture(image, filename)
      avatar.save
    else
      false
    end
  end

  def generate_permalink
    self.permalink = loop do
      new_permalink = Devise.friendly_token.first(PERMALINK_LENGTH)
      break new_permalink unless Event.where(permalink: new_permalink).first
    end if self.permalink.blank?
  end

  def log_activity_creating
    bubble = self.events.bubble
    privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
    Activity.create(name: "events.create", user_id: self.owner.id, user_ip: self.owner.current_sign_in_ip, event_id: self.id, bubble_id: bubble.id, 
                    object_id: self.id, object_type: self.class.name, feed: true, privacy: privacy)
  end

  def log_activity_updating
    bubble = self.events.bubble
    Activity.create(name: "events.update", user_id: self.owner.id, user_ip: self.owner.current_sign_in_ip, event_id: self.id, bubble_id: bubble.id, 
                    object_id: self.id, object_type: self.class.name, feed: false, privacy: Activity.privacies[:p_private])
  end

end
