
json.set! :users do
  json.array! users do |user|
    json.extract! user, :id, :email, :username, :first_name, :phone, :gender, :zip_code, :birthday, :language, :description, :created_at, :updated_at
    json.profile_url user.username  # FIXME: profile_url -> username
    json.avatar_url user.avatar_url
    json.interests_count user.interests.count
    json.updates_count 0
    json.bubbles_count user.bubbles.count
    friends = user.friends.sort { |a, b| [(b.is_online_now? ? 1 : 0), b.last_wheelchat_message_date(user)] <=> [(a.is_online_now? ? 1 : 0), a.last_wheelchat_message_date(user)] }
    json.partial! 'api/v1/users/friends', users: friends
    json.friends_count friends.size
    json.partial! 'api/v1/shared/interests', interests: user.interests
    json.partial! 'api/v1/shared/notifications', notifications: user.unread_notifications.all
  end
end

json.set! :popular_interests do
  json.array! @interests do |interest|
    json.extract! interest, :name
    json.display_as interest.name # FIXME: remove display_as
  end
end
