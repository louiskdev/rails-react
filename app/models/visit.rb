class Visit < ActiveRecord::Base

  belongs_to :user
  belongs_to :visitable, polymorphic: true

  validates :user_id, uniqueness: { scope: [:visitable_type, :visitable_id] }
  validate  :presence_user_or_user_id

  after_create :notify_by_ws

  private
  def presence_user_or_user_id
    if user.nil? and user_id.nil?
      errors.add(:base, "Specify user relation or user_id column")
    end
  end

  def notify_by_ws
    visits_count = Visit.where(visitable_type: visitable_type, visitable_id: visitable_id).count
    type = visitable_type == 'Widgets::BlogWidget::Post' ? 'post' : visitable_type
    # real-time notification
    # Pusher.trigger('global', "#{type}_visits_count_changed", {message: {object_type: visitable_type, object_id: visitable_id,
    #                                                                     visits_count: visits_count, username: user.username }})
    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: "#{type}_visits_count_changed",
        data: {
            message: {
                object_type: visitable_type,
                object_id: visitable_id,
                visits_count: visits_count,
                username: user.username
            }
        },
        debug_info: {
            location: 'Visit#notify_by_ws',
            object_type: visitable_type,
            object_id: visitable_id,
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end
end
