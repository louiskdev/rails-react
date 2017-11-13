json_response(json) do
  json.partial! 'api/v1/widgets/gallery_widget/media/media', media: [@media]
end