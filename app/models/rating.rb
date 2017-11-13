class Rating < ActiveRecord::Base
  belongs_to :user
  belongs_to :ratingable, polymorphic: true

  after_create :notify_the_author

  validates :value,
            presence: true,
            numericality: { only_integer: true }
  validates :user_id,
            presence: true,
            numericality: { only_integer: true }
  validates :ratingable_id,
            presence: true,
            numericality: { only_integer: true }
  validates :ratingable_type, presence: true
  validates :user_id, uniqueness: { scope: [:ratingable_id, :ratingable_type] }

  private
  def notify_the_author
    object = self.ratingable
    object_type = case object.class.name
                    when 'Widgets::BlogWidget::Post' then 'post'
                    else
                      object.class.name.downcase
                  end
    if object.user_id != self.user_id
      notification_attrs = {user_id: object.user_id,
                            initiator_type: 'User',
                            initiator_id: self.user_id,
                            name: "#{object_type}:rated",
                            extra_data: {
                                rating: self.value
                            }}
      activity = object.activities.where(feed: true).last
      notification_attrs.merge!(object_type: activity.class.name, object_id: activity.id) unless activity.nil?
      Notification.create(notification_attrs)
    end
  end
end
