json_response(json) do
  json.partial! 'bubble', bubbles: [@bubble], bubble_member: bubble_member
  json.set! :users do
    json.array! [current_user] do |user|
      json.extract! user, :id, :first_name, :email, :language, :username
      json.profile_url user.username  # FIXME: profile_url -> username
      json.access_token user.api_key.access_token
      json.avatar_url user.avatar_url(:thumb)
      json.is_completed user.valid?
    end
  end
end
