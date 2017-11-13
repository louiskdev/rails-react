json_response(json) do
  json.set! :gallery do
    json.partial! 'api/v1/shared/media', media: @media, media_count: @media.count
  end
end
