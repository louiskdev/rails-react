json.set! :members do
  json.array! members do |member|
    json.extract! member, :first_name, :username
    json.profile_url member.username  # FIXME: profile_url -> username
    json.avatar_url member.avatar_url(:micro)
    json.online member.is_online_now?
  end
end