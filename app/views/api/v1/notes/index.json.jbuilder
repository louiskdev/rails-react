json_response(json) do
  json.partial! 'api/v1/notes/notes', notes: @notes, trim: true
end
