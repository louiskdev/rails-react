json_response(json) do
  json.set! :users do
    json.array! @friends do |user|
      json.extract! user, :id, :first_name, :username
      json.profile_url user.username  # FIXME: profile_url -> username
      json.avatar_url user.avatar_url(:micro)
      json.missed_messages_count ::WheelChat::Notification.where(initiator_id: user.id, user_id: current_user.id).count
    end
  end
end