json_response(json) do
  json.set! :users do
    json.array! [@user] do |user|
      json.extract! user, :id, :username
      json.profile_url user.username  # FIXME: profile_url -> username
      json.avatar_url user.avatar_url(:thumb)
      friendship_status = user.friendships.where(friend_id: current_user.id).first.try(:status) || ''
      json.friendship_status friendship_status
    end
  end
end
