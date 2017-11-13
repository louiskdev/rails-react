json.extract! activity, :id, :created_at, :object_type
json.name activity.user_friendly_name(feed_type: feed_type)
user = User.find_by(id: activity.user_id)
if user.present?
  json.set! :user do
    current_user_in_bubles_feed = (feed_type == 'bubbles' && current_user == user) rescue false
    first_name = feed_type == 'own' || current_user_in_bubles_feed ? 'You' : user.first_name
    json.first_name first_name
    json.thumb_avatar_url user.avatar_url(:thumb)
    json.profile_url user.username
    json.username user.username
  end
else
  json.user ''
end

if activity.object_type.present? and activity.object_id.present?
  object = activity.object_type.safe_constantize.find_by(id: activity.object_id)   # activity.object
  if object.present?
    json.set! :object do
      case activity.object_type
        when 'Note'
          json.partial! 'api/v1/shared/feed/note', note: object, trim: true
        when 'Medium'
          json.partial! 'api/v1/shared/feed/medium', medium: object, activity: activity
        when 'Widgets::BlogWidget::Post'
          json.partial! 'api/v1/shared/feed/blog_widget_post', post: object, activity: activity, trim: true
        when 'Bubble' then
          json.partial! 'api/v1/shared/feed/extra_fields', activity: activity
        when 'Album' then
          json.partial! 'api/v1/shared/feed/album', album: object, activity: activity
      end
    end
  else
    json.object ''
  end
else
  json.partial! 'api/v1/shared/feed/extra_fields', activity: activity
end
