json_response(json) do
  json.set! :members do
    json.array! @members do |member|
      json.extract! member, :id, :first_name, :username
      json.profile_url member.username || ''      # FIXME: profile_url -> username
      json.avatar_url member.avatar_url(:micro)
      json.is_friend member.friend_of?(current_user)
    end
  end
end
