class Bubble < ActiveRecord::Base
  include ImageProcessing
  include CoverImage

  RECOMMENDED_COUNT = 12
  PERMALINK_LENGTH = 8
  enum kind: [:global, :common, :privy]

  attr_accessor :actor

  acts_as_likeable
  geocoded_by :zip_code
  after_validation :geocode, if: ->(obj){ obj.zip_code.present? and obj.zip_code_changed? }

  has_many :bubble_members, dependent: :destroy, counter_cache: :members_count
  has_many :members, through: :bubble_members
  has_many :bubble_blocked_users, dependent: :destroy
  has_many :blocked_users, through: :bubble_blocked_users
  has_many :bubble_invitations, dependent: :destroy
  has_many :bubble_interests, dependent: :destroy, counter_cache: :interests_count
  has_many :interests, through: :bubble_interests
  has_one  :avatar, as: :avatarable, dependent: :destroy
  has_many :widgets, dependent: :destroy
  has_many :gallery_widgets, through: :widgets, :source => :widgetable, :source_type => 'Widgets::GalleryWidget::Gallery'
  has_many :notifications, as: :initiator

  after_initialize :generate_permalink
  after_create :log_activity_creating
  after_update :log_activity_updating
  after_save :add_new_suggestions
  after_destroy :log_activity_destroying

  validates :name,
            presence: true,
            uniqueness: true
  validates :kind, presence: true
  # validates :description, presence: true
  validates :permalink,
            presence: true,
            uniqueness: true
  # validates :avatar, presence: true, on: :update

  scope :common_or_global, -> { where(kind: [Bubble.kinds[:common], Bubble.kinds[:global]]) }

  def self.normalize_kind_attr(kind)
    case kind
      when 'common', 'public' then 'common'
      when 'privy', 'private' then 'privy'
      else
        kind
    end
  end

  def owner
    self.members.joins(:bubble_members).where("bubble_members.user_role = #{BubbleMember.user_roles[:owner]}").first
  end

  def online_member_ids
    Redis.current.smembers("bubblz:bubble_#{self.permalink}:online_user_ids").map {|el| el.to_i }
  end

  def online_members
    self.members.where(id: self.online_member_ids)
  end

  def gallery_widget
    # self.widgets.where(widgetable_type: 'Widgets::GalleryWidget::Gallery').first.try(:widgetable)
    self.gallery_widgets.first
  end

  def chat_widget
    self.widgets.find_by(widgetable_type: "Widgets::ChatWidget::Chat").try(:widgetable)
  end

  def blog_widget
    self.widgets.find_by(widgetable_type: "Widgets::BlogWidget::Blog").try(:widgetable)
  end

  def events_widget
    self.widgets.find_by(widgetable_type: "Widgets::EventsWidget::Events").try(:widgetable)
  end

  def files_widget
    self.widgets.find_by(widgetable_type: "Widgets::FilesWidget::Files").try(:widgetable)
  end

  def feed_unread_items_count_by_user(user)
    attendance = user.attendances.find_by(url: "/bubbles/#{self.permalink}", section: "bubble_feed")
    activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
        where(bubble_id: self.id, feed: true, shared: false).where.not(user_id: user.id).
        where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND (ignorings.user_id <> :user_id OR (ignorings.location <> \'bubble_feed\' AND ignorings.location <> \'activity\')))',
              model: 'Activity', user_id: user.id)
    activities = activities.where.not(name: ['bubbles.join_user', 'bubbles.disjoin_user']) unless self.privy?
    activities = activities.where('activities.created_at > ?', attendance.latest_date) unless attendance.try(:latest_date).nil?
    count = activities.count
    count = 10 if count > 10
    count
  end

  def blog_unread_items_count_by_user(user)
    return 0 if self.blog_widget.nil?

    attendance = user.attendances.find_by(url: "/bubbles/#{self.permalink}", section: "bubble_blog")
    activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
        where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND ignorings.user_id <> :user_id)', model: 'Activity', user_id: user.id).
        where(bubble_id: self.id, feed: true, shared: false, object_type: 'Widgets::BlogWidget::Post').where.not(user_id: user.id)
    activities = activities.where('activities.created_at > ?', attendance.latest_date) unless attendance.try(:latest_date).nil?
    count = activities.count
    count = 10 if count > 10
    count
  end

  def gallery_unread_items_count_by_user(user)
    return 0 if self.gallery_widget.nil?

    attendance = user.attendances.find_by(url: "/bubbles/#{self.permalink}", section: "bubble_gallery")
    media = self.gallery_widget.media.where.not(user_id: user.id)
    media = media.where('media.created_at > ?', attendance.latest_date) unless attendance.try(:latest_date).nil?
    count = media.count
    count = 10 if count > 10
    count
  end

  def chat_unread_items_count_by_user(user)
    return 0 if self.chat_widget.nil?

    attendance = user.attendances.find_by(url: "/bubbles/#{self.permalink}", section: "bubble_chat")
    messages = self.chat_widget.messages.where.not(user_id: user.id)
    messages = messages.where('created_at > ?', attendance.latest_date) unless attendance.try(:latest_date).nil?
    count = messages.count
    count = 10 if count > 10
    count
  end

  def events_unread_items_count_by_user(user)
    return 0 if self.events_widget.nil?

    attendance = user.attendances.find_by(url: "/bubbles/#{self.permalink}", section: "bubble_events")
    events = self.events_widget.events.where.not(owner_id: user.id)
    events = events.where('created_at > ?', attendance.latest_date) unless attendance.try(:latest_date).nil?
    count = events.count
    count = 10 if count > 10
    count
  end

  def total_unread_items_count_by_user(user)
    count = 0
    widgets = ['blog', 'chat', 'events', 'gallery']
    i = 0
    while count < 10 and i < widgets.size
      count += self.send("#{widgets[i]}_unread_items_count_by_user", user)
      i += 1
    end

    count = 10 if count > 10
    count
  end
  # unread messages counters

  def substantive_media
    self.gallery_widget.media.where(album_id: nil)
  end

  def apply_interests(interest_names)
    interest_names = [interest_names] if interest_names.is_a?(String)
    return false unless interest_names.is_a?(Array)

    # normalize input data
    interest_names.map! { |name| name.strip.downcase }.reject! {|name| name.blank? }

    #destory non actual bubble_interests
    self.interests.each do |interest|
      unless interest_names.include?(interest.name)
        BubbleInterest.destroy_all(bubble_id: self.id, interest_id: interest.id)
      end
    end

    # add new interests to bubble
    interest_names.each do |interest_name|
      interest = Interest.find_or_create_by(name: interest_name)
      if BubbleInterest.find_by(bubble_id: self.id, interest_id: interest.id).nil?
        interest.bubbles << self
        interest.save
      end
    end

    true
  end

  def avatar_url(version=nil)
    if avatar.present?
      avatar.picture_url(version)
    else
      Avatar.new.picture_url(version)
    end
  end

  def just_created
    self.created_at > 30.seconds.ago
  end

  private

  def generate_permalink
    self.permalink = loop do
      new_permalink = Devise.friendly_token.first(PERMALINK_LENGTH)
      break new_permalink unless Bubble.where(permalink: new_permalink).first
    end if self.permalink.blank?
  end

  def add_new_suggestions
    if self.common? or self.global?
      self.name.split(' ').each do |word|
        Suggestion.create(keyword: word)
      end
    end
  end

  def log_activity_creating
    privacy = self.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
    Activity.create(name: "bubbles.create", user_id: self.owner.id, user_ip: self.owner.current_sign_in_ip, bubble_id: self.id,
                    object_id: self.id, object_type: self.class.name, feed: true, privacy: privacy)
  end

  def log_activity_updating
    Activity.create(name: "bubbles.update", user_id: self.actor.try(:id), user_ip: self.actor.try(:current_sign_in_ip), bubble_id: self.id,
                    object_id: self.id, object_type: self.class.name, feed: false, privacy: Activity.privacies[:p_private])
  end

  def log_activity_destroying
    Activity.create(name: "bubbles.destroy", user_id: self.actor.try(:id), user_ip: self.actor.try(:current_sign_in_ip),
                    bubble_id: self.id, object_id: self.id, object_type: self.class.name, feed: false,
                    privacy: Activity.privacies[:p_private], extra_data: {name: self.name, permalink: self.permalink})

    # hide all associated activities
    Activity.where(bubble_id: self.id, feed: true).update_all(feed: false)
    Activity.where(object_id: self.id, object_type: self.class.name, feed: true).update_all(feed: false)

    # rm associated notifications
    Notification.destroy_all(object_id: self.id, object_type: self.class.name)
    ids = Activity.where(bubble_id: self.id).ids
    Notification.destroy_all(object_id: ids, object_type: 'Activity')
  end

end
