class User < ActiveRecord::Base
  include ImageProcessing
  include CoverImage

  CLOSE_PPROXIMITY_BUBBLE = 50
  ONLINE_TIME_INTERVAL_IN_MINUTES = 1
  USERNAME_BLACK_LIST = -> do
    black_list = []
    text = File.open(Rails.root.join('config', 'swearWords.txt')).read
    text.each_line { |line| black_list << line.delete("\n").strip }
    black_list
  end.call

  enum gender: [ :male, :female ]

  attr_accessor :agree_to_terms, :current_client_id

  geocoded_by :zip_code
  after_validation :geocode, if: ->(obj){ obj.zip_code.present? and obj.zip_code_changed? }

  acts_as_liker

  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  # :registerable, :rememberable
  devise :database_authenticatable, :recoverable, :trackable, :validatable, :confirmable
  include Devise::Models::ConfirmableOverrides #TODO fix for:   user.save(validate: false)  -->  user.errors.present? == true

  has_many :avatars, as: :avatarable, dependent: :destroy
  belongs_to :default_avatar, class_name: 'Avatar', foreign_key: :default_avatar_id
  has_many :api_keys, dependent: :destroy
  has_many :identities, dependent: :destroy
  has_many :bubble_members, dependent: :destroy, counter_cache: :bubbles_count
  has_many :bubbles, through: :bubble_members
  has_many :media, dependent: :destroy
  has_many :user_interests, dependent: :destroy, counter_cache: :interests_count
  has_many :interests, through: :user_interests
  has_many :activities, dependent: :nullify
  has_many :favorite_activities, dependent: :destroy
  has_many :received_notifications, class_name: 'Notification'
  has_many :notifications, as: :initiator
  has_many :notes, dependent: :destroy
  has_many :albums
  has_many :visits
  has_many :ignorings, dependent: :destroy
  has_many :ratings, dependent: :destroy
  has_many :attendances, class_name: 'UserAttendance', dependent: :destroy
  has_many :event_members, dependent: :destroy, counter_cache: :events_count
  has_many :events, through: :event_members

  has_many :privy_bubbles, -> { distinct.where(kind: Bubble.kinds[:privy]) }, through: :bubble_members, source: :bubble
  # has_many :friends, ->(user) { distinct.where.not('users.id' => user.id)}, through: :privy_bubbles, source: :members

  has_many :albums
  has_many :friendships, dependent: :destroy
  has_many :friends, -> { where(friendships: { status: Friendship.statuses[:approved]}) }, through: :friendships
  has_many :wheel_chat_notifications, class_name: 'WheelChat::Notification', dependent: :destroy
  has_many :wheel_chat_messages, class_name: 'WheelChat::Message'

  after_initialize :normalize_username, if: -> { self.new_record? }
  before_save  :normalize_username, if: -> { self.username_changed? }
  after_create :reset_access_token!
  after_save   :add_new_suggestions
  after_update :send_new_avatar_notification, if: Proc.new { self.default_avatar_id_changed? }

  # on save validations
  validates :agree_to_terms,
            presence: true,
            acceptance: true

  # only on update validations
  validates :first_name, presence: true, on: :update
  validates :language, presence: true, on: :update
  validates :zip_code, presence: true, on: :update
  validates :birthday, presence: true, on: :update
  validates :username, presence: true, on: :update
  validates :username,
            uniqueness: { case_sensitive: false },
            format: { with: /\A[\w-]+\z/, message: "only allows letters, digits and dash" },
            exclusion: { in: USERNAME_BLACK_LIST, message: 'cannot be a term of offense' },
            allow_blank: true

  scope :completed, -> { where(completed: true) }
  scope :nearest_birthdays, -> (n=1) { where.not(birthday: nil).
      where("DATE_PART('doy', birthday) - date_part('doy', CURRENT_DATE) BETWEEN 0 AND :count", count: n-1).
      order("DATE_PART('doy', birthday)")
  }
  scope :online_users, -> { where(id: User.online_users_ids) }

  def self.online_users_ids
    Redis.current.smembers('bubblz:online_user_ids').map {|el| el.to_i }
  end

  def my_bubbles
    Bubble.joins(:bubble_members).where('bubble_members.user_role' => BubbleMember.user_roles[:owner], 'bubble_members.user_id' => self.id)
  end

  def public_bubbles
    bubbles.common
  end

  def recommended_bubbles(offset=0, count=Bubble::RECOMMENDED_COUNT)
    distance_limit = CLOSE_PPROXIMITY_BUBBLE
    interest_ids = self.user_interests.pluck(:interest_id)
    own_bubble_ids = self.bubbles.pluck(:id)

    # find public bubbles
    bubbles_query = Bubble.distinct.where.not(id: own_bubble_ids)
    bubbles_query = bubbles_query.near(self.zip_code, distance_limit) if self.zip_code.present?
    bubbles_query = bubbles_query.joins(:bubble_interests).where('bubble_interests.interest_id' => interest_ids) if interest_ids.present?
    bubbles_query = bubbles_query.where('bubbles.kind' => Bubble.kinds[:common])
    bubbles = bubbles_query.all.to_a

    # find global bubbles
    global_bubbles_query = Bubble.distinct.where.not(id: own_bubble_ids)
    global_bubbles_query = global_bubbles_query.joins(:bubble_interests).where('bubble_interests.interest_id' => interest_ids) if interest_ids.present?
    global_bubbles_query = global_bubbles_query.where('bubbles.kind' => Bubble.kinds[:global])
    global_bubbles = global_bubbles_query.to_a
    bubbles |=  global_bubbles
    bubbles.sort_by! {|el| el.id }

    recommended_bubbles = bubbles.slice(offset*count, count)
    if offset == 0 and recommended_bubbles.size < count
      recommended_bubbles |= Bubble.common_or_global.where.not(id: recommended_bubbles.map {|el| el.id}).
          where.not(id: own_bubble_ids).order('RANDOM()').limit(count - recommended_bubbles.size).to_a
    end
    recommended_bubbles
  end

  def recommended_users(offset=0, count=12)
    # distance_limit = 50
    interest_ids = self.user_interests.pluck(:interest_id)
    friends_and_current_user_ids = self.friends.pluck(:id)
    friends_and_current_user_ids << self.id

    users_query = User.distinct.completed.where.not(id: friends_and_current_user_ids)
    # users_query = users_query.near(self.zip_code, distance_limit) if self.zip_code.present?       # TODO: temporarily disabled
    users_query = users_query.joins(:user_interests).where('user_interests.interest_id' => interest_ids) if interest_ids.present?
    users = users_query.sample(count)
    users
  end

  def unread_notifications
    self.received_notifications.unread.order(created_at: :desc)
  end

  def last_wheelchat_message_date(user)
    chat = ::WheelChat::Chat.find_by_users(user, self)
    chat.messages.last.created_at rescue DateTime.ordinal(0)
  end

  def reset_access_token!
    token = loop do
      new_token = "#{self.id}:#{Devise.friendly_token}"
      break new_token if ApiKey.where(access_token: new_token).empty?
    end
    client_id = SecureRandom.uuid
    self.api_keys.create(access_token: token, client_id: client_id)

    [token, client_id]
  end

  def role_in_bubble(bubble)
    return false if bubble.blank?
    bubble.bubble_members.find_by(user_id: self.id).try(:user_role)
  end

  def is_owner_of?(bubble)
    return false if bubble.blank?
    bubble.bubble_members.where('bubble_members.user_role' => BubbleMember.user_roles[:owner], 'bubble_members.user_id' => self.id).any?
  end

  def is_moderator_of?(bubble)
    return false if bubble.blank?
    bubble.bubble_members.where('bubble_members.user_role' => BubbleMember.user_roles[:moderator], 'bubble_members.user_id' => self.id).any?
  end

  def is_member_of?(bubble)
    return false if bubble.blank?
    bubble.bubble_members.where('bubble_members.user_id' => self.id).any?
  end

  def is_member_of_the_channel?(channel)
    return false if channel.blank?
    channel.channel_members.where('chat_widget_channel_members.user_id' => self.id).any?
  end

  def can_manage?(bubble)
    return false if bubble.blank?
    bubble.bubble_members.where('bubble_members.user_role' => [BubbleMember.user_roles[:owner], BubbleMember.user_roles[:moderator]],
                                'bubble_members.user_id' => self.id).any?
  end

  def can_view?(resource)
    resource = resource.commentable if resource.is_a?(Comment)
    case resource.class.name
      when 'Activity'
        activity = resource
        if !activity.feed?
          false
        elsif activity.bubble_id.nil?
          activity.user_id.present? && (activity.user_id == self.id || !activity.p_private? && self.friend_of?(activity.user_id))
        else
          bubble = Bubble.find_by(id: activity.bubble_id)
          !(bubble.nil? || bubble.privy? && !(self.is_member_of?(bubble) or self.id == activity.user_id))
        end
      when 'Medium', 'Album'
        if resource.gallery.present?
          bubble = resource.gallery.bubble
          !(bubble.nil? || bubble.privy? && !self.is_member_of?(bubble))
        elsif resource.is_a?(Album) || resource.mediable.blank?
          # media.user_id == self.id || (media.album.try(:p_public?) && self.friend_of?(media.user_id))
          resource.user_id == self.id || self.friend_of?(resource.user_id)  # ignore picture/video privacy
        else
          true
        end
      when 'Note'
        note = resource
        note.user_id == self.id || (!note.private? && self.friend_of?(note.user_id))
      when 'Widgets::BlogWidget::Post'
        post = resource
        bubble = post.blog.bubble
        !(bubble.nil? || bubble.privy? && !(self.is_member_of?(bubble) or self.id == post.user_id))
      else
        raise 'Unsupported resource type in User#can_view?'
    end
  end

  def is_participant_of?(event)
    return false if event.blank?
    event.event_members.where('event_members.user_id' => self.id).first.present?
  end

  def friend_of?(user_or_id)
    user_id = user_or_id.is_a?(Fixnum) ? user_or_id : user_or_id.is_a?(User) ? user_or_id.id : nil
    raise 'Invalid argument for User#friend_of?' if user_id.nil?
    Friendship.where(user_id: user_id, friend_id: self.id, status: Friendship.statuses[:approved]).any?
  end

  def is_online_now?
    # if self.last_ping_date.nil?
    #   false
    # else
    #   (self.last_ping_date + ONLINE_TIME_INTERVAL_IN_MINUTES.minutes) > DateTime.now
    # end

    Redis.current.sismember('bubblz:online_user_ids', "#{self.id}")
  end

  def is_online_in_bubble?(bubble)
    if bubble.is_a?(Bubble)
      Redis.current.sismember("bubblz:bubble_#{bubble.permalink}:online_user_ids", "#{self.id}")
    else
      nil
    end
  end

  def apply_interests(interest_names)
    interest_names = [interest_names] if interest_names.is_a?(String)
    return false unless interest_names.is_a?(Array)

    # normalize input data
    interest_names.map! { |name| name.strip.downcase }

    #destory non actual user_interests
    self.interests.each do |interest|
      unless interest_names.include?(interest.name)
        UserInterest.destroy_all(user_id: self.id, interest_id: interest.id)
      end
    end

    # add new interests to user
    interest_names.each do |interest_name|
      interest = Interest.find_or_create_by(name: interest_name)
      if UserInterest.find_by(user_id: self.id, interest_id: interest.id).nil?
        interest.users << self
        interest.save
      end
    end

    true
  end

  def apply_avatar(image, filename=nil, options={})
    return false if image.blank?

    attrs = {kind: :common}
    attrs.merge!(options) unless options.blank?

    avatar = self.avatars.build(attrs)
    if avatar.add_picture(image, filename)
      if avatar.save
        self.default_avatar = avatar
        return self.save(validate: false)
      end
    end

    false
  end

  def apply_avatar_to_bubble(bubble, image, filename=nil, options={})
    return false if image.blank? or avatar_not_changed?(image)

    attrs = {kind: :common, user_id: self.id}
    attrs.merge!(options) unless options.blank?

    avatar = bubble.build_avatar(attrs)
    if avatar.add_picture(image, filename)
      avatar.save
    else
      false
    end
  end

  def avatar_not_changed?(image_path)
    File.exist?("#{Rails.root}/public#{image_path}")
  end

  def avatar_url(version=nil)
    if default_avatar_id.present?
      self.default_avatar.picture_url(version) rescue Avatar.new.picture_url(version)
    elsif avatars.first.present?
      self.avatars.first.picture_url(version) rescue Avatar.new.picture_url(version)
    else
      Avatar.new.picture_url(version)
    end
  end

  def set_rating_for(object, value)
    if object.respond_to? :ratings
      rating = object.ratings.where(user_id: self.id).first
      if rating.nil?
        object.ratings.create(value: value, user: self)
      else
        rating.update(value: value)
      end
    else
      false
    end
  end

  def notify_unread_items_count_changed(bubble)
    ws_msg = {
        adapter: 'pusher',
        data: {
            total_unread_items_count: bubble.total_unread_items_count_by_user(self),
            bubble: {
                id: bubble.id,
                permalink: bubble.permalink
            }
        },
        debug_info: {
            location: 'User#notify_unread_items_count_changed',
        }
    }

    ws_msg[:channel] = "private-dashboard-#{self.id}"
    ws_msg[:event] = 'total_unread_items_count_changed'
    RealTimeNotificationJob.perform_later(ws_msg)

    ws_msg[:channel] = "private-bubble-#{bubble.permalink}-#{self.id}"
    ws_msg[:event] = 'feed_unread_items_count_changed'
    ws_msg[:data][:feed_unread_items_count] = bubble.feed_unread_items_count_by_user(self)
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  # Override Devise::Models::Recoverable method
  # Update password saving the record and clearing token. Returns true if
  # the passwords are valid and the record was saved, false otherwise.
  def reset_password(new_password, new_password_confirmation)
    self.password = new_password
    self.password_confirmation = new_password_confirmation

    if respond_to?(:after_password_reset) && valid?
      ActiveSupport::Deprecation.warn "after_password_reset is deprecated"
      after_password_reset
    end

    # add this expression
    if invalid?
      unless self.errors.include?(:password) or self.errors.include?(:password_confirmation)
        self.errors.clear
        return save(validate: false)
      end
    end

    save
  end

  # Override
  def self.find_for_database_authentication(conditions={})
    find_by_login(conditions[:email])
  end

  def self.find_by_login(login)
    return nil if login.nil?
    where("username = :value OR email = :value", value: login).first
  end

  private

  def normalize_username
    unless self.username.blank?
      self.username.strip!
      self.username.downcase!
    end
  end

  def add_new_suggestions
    if self.valid?
      self.first_name.split(' ').each do |word|
        Suggestion.create(keyword: word)
      end
    end
  end

  def send_new_avatar_notification
    # shared message part
    ws_msg = {
        adapter: 'pusher',
        data: {
            user_data: {
                id: self.id,
                username: self.username,
                thumb_avatar_url: self.avatar_url(:thumb)
            }
        },
        debug_info: {
            user_id: self.id,
        }
    }

    # notify current user
    ws_msg[:channel] = "private-user-#{self.id}"
    ws_msg[:event] = 'avatar_changed'
    ws_msg[:debug_info][:location] = 'User#send_new_avatar_notification (1)'
    RealTimeNotificationJob.perform_later(ws_msg)

    # notify friends
    channels = self.friends.online_users.ids.map {|friend_id| "private-user-#{friend_id}" }
    ws_msg[:channel] = channels
    ws_msg[:event] = 'friend_avatar_changed'
    ws_msg[:debug_info][:location] = 'User#send_new_avatar_notification (2)'
    RealTimeNotificationJob.perform_later(ws_msg)

    # notify bubble members
    channels = self.bubbles.pluck(:permalink).map {|bubble_permalink| "private-bubble-#{bubble_permalink}" }
    ws_msg[:channel] = channels
    ws_msg[:event] = 'member_avatar_changed'
    ws_msg[:debug_info][:location] = 'User#send_new_avatar_notification (3)'
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
