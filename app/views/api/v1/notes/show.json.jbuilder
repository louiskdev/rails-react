json_response(json) do
  json.partial! 'api/v1/notes/notes', notes: [@note], trim: (trim rescue false)
end
