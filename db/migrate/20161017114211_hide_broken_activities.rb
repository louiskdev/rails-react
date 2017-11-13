class HideBrokenActivities < ActiveRecord::Migration
  def up
    Activity.where(feed: true).find_in_batches do |activies|
      activies.each do |activity|
        if activity.bubble_id.present? and Bubble.find_by(id: activity.bubble_id).nil?
          activity.update(feed: false)
        end

        if activity.object_id.present? and activity.object_type.safe_constantize.try(:find_by, {id: activity.object_id}).nil?
          activity.update(feed: false)
        end
      end
    end
  end

  def down
    # nothing
  end
end
