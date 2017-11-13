json_response(json) do
  json.set! :gallery do
    json.partial! 'api/v1/widgets/gallery_widget/media/media', media: @media, media_count: @media.count
  end
end
