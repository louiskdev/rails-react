class EventMember < ActiveRecord::Base
  enum user_role: [:owner, :member]

  belongs_to :member, class_name: "User", foreign_key: :user_id #, counter_cache: :events_count
  belongs_to :event, counter_cache: :members_count

  # after_create :log_activity_creating
  # after_destroy :log_activity_destoying

  validates :user_role, presence: true
  validates :event_id, uniqueness: { scope: :user_id }
  validate  :presence_event_or_event_id
  validate  :presence_member_or_user_id

  private

  def presence_event_or_event_id
    if event.nil? and event_id.nil?
      errors.add(:base, "Specify event relation or event_id column")
    end
  end

  def presence_member_or_user_id
    if member.nil? and user_id.nil?
      errors.add(:base, "Specify member relation or user_id column")
    end
  end

  def log_activity_creating
    event = self.event
    # return if event.just_created
    # OR
    # return if event.owner.id == self.user_id

    user = self.member
    activity = Activity.create( name: "events.join_user",
                                user_id: user.id,
                                user_ip: user.current_sign_in_ip,
                                object_id: event.id,
                                object_type: event.class.name,
                                event_id: event.id,
                                feed: true,
                                # extra_data: { added_by: "#{@bi.moderator.first_name} (#{@bi.moderator.username})" },  # FIXME: disabled for now
                                privacy: false)
  end

  def log_activity_destoying
    event = self.event
    user = self.member

    activity = Activity.create(name: "events.disjoin_user",
                               user_id: user.id,
                               user_ip: user.current_sign_in_ip,
                               object_id: event.id,
                               object_type: event.class.name,
                               event_id: event.id,
                               feed: true,
                               privacy: false)
    activity.ignorings.create(user_id: activity.user_id)
  end

end
