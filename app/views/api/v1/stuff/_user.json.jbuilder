
json.extract! user, :id, :first_name, :gender, :language, :username
json.profile_url user.username  # FIXME: profile_url -> username
json.avatar_url user.avatar_url(:thumb)
