json_response(json) do
  json.set! :users do
    json.array! [@user] do |user|
      json.extract! user, :email
    end
  end
end