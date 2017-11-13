json_response(json) do
  json.set! :popular_interests do
    json.array! @interests do |interest|
      json.extract! interest, :name
      json.display_as interest.name  # FIXME: remove display_as
    end
  end

  json.set! :widgets do
    json.array! @widgets do |widget|
      json.name widget
    end
  end
end
