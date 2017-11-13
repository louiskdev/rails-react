if user.nil?
  json.user ''
else
  json.set! :user do
    json.extract! user, :first_name, :username
    json.profile_url user.username  # FIXME: profile_url -> username
    json.thumb_avatar_url user.avatar_url(:thumb)
  end
end
