json_response(json) do
  json.set! :users do
    json.array! [current_user] do |user|
      json.extract! user, :id
      json.avatar_url user.avatar_url(:thumb)
    end
  end
end
