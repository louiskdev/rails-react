json_response(json) do
  json.set! :settings do
    json.extract! @chat, :channel_name, :mute
  end
end