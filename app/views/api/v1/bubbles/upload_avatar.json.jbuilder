json_response(json) do
  json.set! :bubbles do
    json.array! [@bubble] do |bubble|
      json.extract! bubble, :id, :permalink
      json.avatar_url bubble.avatar_url(:thumb)
    end
  end
end