json.set! :notes do
  json.array! notes do |note|
    json.partial! 'api/v1/notes/note', note: note
  end
end
