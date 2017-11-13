json.set! :unread_activities_count, (unread_activities_count || 0)
json.set! :load_more, (@load_more || false)
json.set! :feed do
  json.array! activities do |activity|
    json.partial! 'api/v1/shared/feed/activity_base_template', activity: activity, feed_type: feed_type

    if activity.bubble_id.nil?
      json.bubble ''
    else
      bubble = Bubble.find_by(id: activity.bubble_id)
      if bubble.nil?
        json.bubble ''
      else
        json.set! :bubble do
          json.id bubble.id
          json.name bubble.name
          json.permalink bubble.permalink
          json.micro_avatar_url bubble.avatar_url(:micro)
        end
      end
    end

  end
end
