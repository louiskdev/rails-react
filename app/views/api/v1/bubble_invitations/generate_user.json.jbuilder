json_response(json) do
  json.set! :users do
    json.array! [@user] do |user|
      json.extract! user, :id
      json.access_token user.api_key.access_token
    end
  end
end