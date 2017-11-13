json_response(json) do
  json.partial! 'api/v1/widgets/gallery_widget/media/media', media: @collection, media_count: @media_count
end
