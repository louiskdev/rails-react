json.set! :interests do
  json.array! interests do |interest|
    json.extract! interest, :name
    json.display_as interest.name # FIXME: remove display_as
  end
end