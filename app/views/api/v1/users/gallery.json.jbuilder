json_response(json) do
  json.set! :gallery do
    json.partial! 'api/v1/shared/media', media: @media, media_count: @media.count
    json.unviewed_media_count @unviewed_media_count || 0
  end
end
