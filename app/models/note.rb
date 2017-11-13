class Note < ActiveRecord::Base
  include ::Post::Base
  include Mention

  after_create :log_activity_creating
  after_destroy :hide_activities_and_notify_users
  after_destroy :log_activity_destroying

  # Helper method to give process_mentions method content of comment
  def mentioning_text
    self.text
  end

  private

  def log_activity_creating
    privacy = self.private? ? Activity.privacies[:p_private] : Activity.privacies[:p_friends]
    Activity.create(name: "notes.create", user_id: user.id, user_ip: user.current_sign_in_ip, feed: true,
                    object_id: self.id, object_type: self.class.name, privacy: privacy)
  end

  def log_activity_destroying
    BackgroundJob.perform_later('Note', 'log_activity_destroying_bg', self.id, self.user_id)
  end

  def self.log_activity_destroying_bg(note_id, user_id)
    user_ip = User.where(id: user_id).pluck(:current_sign_in_ip).first
    Activity.create(name: "notes.destroy", user_id: user_id, user_ip: user_ip, feed: false,
                    object_id: note_id, object_type: 'Note', privacy: Activity.privacies[:p_private])
  end

  def hide_activities_and_notify_users
    BackgroundJob.perform_later('Note', 'hide_activities_and_notify_users_bg', self.id, self.private?, self.user_id)
  end

  def self.hide_activities_and_notify_users_bg(note_id, is_private, user_id)
    activity_ids = Activity.where(object_id: note_id, object_type: self.name, feed: true).ids
    # hide all visible activities
    Activity.where(id: activity_ids).update_all(feed: false)

    # real-time notification
    ws_msg = {
        event: 'note_removed',
        data: {
            note_data: {
                note_id: note_id,
                activity_ids: activity_ids
            }
        },
        debug_info: {
            location: "#{self.name}.notify_users_bg",
            note_id: note_id,
            activity_ids: activity_ids,
        }
    }

    ws_msg[:channel] = "private-dashboard-#{user_id}"
    ws_msg[:debug_info][:receivers] = 'current user'
    PusherNotifier.forward(ws_msg)

    user = User.find_by(id: user_id)
    if user.present? and !is_private
      online_friend_ids = user.friends.online_users.ids
      unless online_friend_ids.empty?
        channels = online_friend_ids.map { |friend_id| "private-dashboard-#{friend_id}" }
        ws_msg[:channel] = channels
        ws_msg[:debug_info][:receivers] = 'friends'
        PusherNotifier.forward(ws_msg)
      end
    end
  end

end
