json_response(json) do
  json.set! :users do
    json.array! [current_user] do |user|
      json.extract! user, :id, :email, :username, :first_name, :phone, :gender, :zip_code, :birthday, :language

      # temp fix
      json.profile_url user.username || ''   # FIXME: profile_url -> username
      json.avatar_url user.avatar_url(:thumb)
      json.partial! 'api/v1/shared/interests', interests: user.interests
      json.partial! 'api/v1/shared/notifications', notifications: user.unread_notifications.all
    end
  end
end
