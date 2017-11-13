json_response(json) do
  json.set! :suggestions do
    json.array! @suggestions
  end
end