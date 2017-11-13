json_response(json) do
  json.set! :bubbles do
    json.array! [@bubble] do |bubble|
      json.extract! bubble, :id, :permalink
      json.partial! 'api/v1/shared/likes', object: bubble
    end
  end
end
