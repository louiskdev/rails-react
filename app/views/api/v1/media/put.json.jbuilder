json_response(json) do
  json.partial! 'api/v1/shared/media', media: [@media]
end