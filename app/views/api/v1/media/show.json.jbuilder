json_response(json) do
  json.partial! 'api/v1/shared/medium', medium: @media
end
