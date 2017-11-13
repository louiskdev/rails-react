json_response(json) do
  json.set! :bubbles do
    json.array! @bubbles do |bubble|
      json.partial! 'bubble', bubble: bubble
    end
  end
end