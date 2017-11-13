class BubbleMember < ActiveRecord::Base
  enum user_role: [:owner, :moderator, :guest]

  belongs_to :member, class_name: "User", foreign_key: :user_id, counter_cache: :bubbles_count
  belongs_to :bubble, counter_cache: :members_count

  after_create :log_activity_creating
  after_create :notify_member_joined
  after_destroy :log_activity_destoying
  after_destroy :notify_member_left

  validates :user_role, presence: true
  validates :bubble_id, uniqueness: { scope: :user_id }
  validate  :presence_bubble_or_bubble_id
  validate  :presence_member_or_user_id

  private

  def presence_bubble_or_bubble_id
    if bubble.nil? and bubble_id.nil?
      errors.add(:base, "Specify bubble relation or bubble_id column")
    end
  end

  def presence_member_or_user_id
    if member.nil? and user_id.nil?
      errors.add(:base, "Specify member relation or user_id column")
    end
  end

  def log_activity_creating
    bubble = self.bubble
    return if bubble.just_created
    # OR
    # return if bubble.owner.id == self.user_id

    user = self.member
    activity = Activity.create( name: "bubbles.join_user",
                                user_id: user.id,
                                user_ip: user.current_sign_in_ip,
                                object_id: bubble.id,
                                object_type: bubble.class.name,
                                bubble_id: bubble.id,
                                feed: true,
                                # extra_data: { added_by: "#{@bi.moderator.first_name} (#{@bi.moderator.username})" },  # FIXME: disabled for now
                                privacy: Activity.privacies[:p_private])
    # activity.ignorings.create(user_id: activity.user_id)
  end

  def notify_member_joined
    bubble = self.bubble
    new_user = self.member

    if new_user.present? and bubble.present?
      #send new bubble notification
      msg = {
          adapter: 'pusher',
          channel: "private-user-#{self.user_id}",
          event: 'user_joined_bubble',
          data: {
              bubble: {
                  id: bubble.id,
                  name: bubble.name,
                  permalink: bubble.permalink,
                  thumb_avatar_url: bubble.avatar_url(:thumb),
                  type: bubble.kind,
                  user_role: self.user_role,
                  liked: bubble.liked_by?(new_user),
                  likes_count: bubble.likers_count,
                  members_count: bubble.members_count,
                  total_unread_items_count: bubble.total_unread_items_count_by_user(new_user)
              }
          },
          debug_info: {
              location: 'BubbleMember#notify_member_joined (1)',
              channel: "private-user-#{self.user_id}",
              bubble_id: self.bubble_id
          }
      }
      RealTimeNotificationJob.perform_later(msg)

      # notify all members of this bubble new member is joining
      if bubble.owner.id != self.user_id # OR unless bubble.just_created
        new_user_data = { id: new_user.id,
                          first_name: new_user.first_name,
                          username: new_user.username,
                          avatar_url: new_user.avatar_url(:micro),
                          online: self.online?
        }

        ws_msg = {
            adapter: 'pusher',
            channel: "private-bubble-#{bubble.permalink}",
            event: 'member_joined',
            data: {
                member: new_user_data
            },
            debug_info: {
                location: 'BubbleMember#notify_member_joined (2)',
                bubble_id: self.bubble_id,
                new_member_id: new_user.id,
            }
        }
        RealTimeNotificationJob.perform_later(ws_msg)
      end
    end
  end


  def log_activity_destoying
    bubble = self.bubble
    user = self.member

    activity = Activity.create(name: "bubbles.disjoin_user",
                               user_id: user.id,
                               user_ip: user.current_sign_in_ip,
                               object_id: bubble.id,
                               object_type: bubble.class.name,
                               bubble_id: bubble.id,
                               feed: true,
                               privacy: Activity.privacies[:p_private])
    activity.ignorings.create(user_id: activity.user_id)
  end

  def notify_member_left
    user = self.member
    bubble = self.bubble

    if user.present? and bubble.present?
      #send notification to user
      msg = {
          adapter: 'pusher',
          channel: "private-user-#{user.id}",
          event: 'user_left_bubble',
          data: {
              bubble: {
                  id: bubble.id,
                  permalink: bubble.permalink,
              }
          },
          debug_info: {
              location: 'BubbleMember#notify_member_left (1)',
              channel: "private-user-#{user.id}",
              bubble_id: bubble.id
          }
      }
      RealTimeNotificationJob.perform_later(msg)

      #send notification to bubble members
      ws_msg = {
          adapter: 'pusher',
          channel: "private-bubble-#{bubble.permalink}",
          event: 'member_left',
          data: {
              member: {
                  id: user.id,
                  username: user.username
              }
          },
          debug_info: {
              location: 'BubbleMember#notify_member_left',
              bubble_id: bubble.id,
              member_id: user.id,
          }
      }
      RealTimeNotificationJob.perform_later(ws_msg)

      # notify privy bubble's owner
      Notification.create(user_id: bubble.owner.id,
                          initiator_type: 'User',
                          initiator_id: user.id,
                          name: 'bubbles.disjoin_user',
                          object_type: bubble.class.name,
                          object_id: bubble.id,
                          extra_data: {
                              bubble_id: bubble.id,
                              bubble_avatar: bubble.avatar_url
                          }) if bubble.owner.present? and bubble.privy?
    end
  end

end
