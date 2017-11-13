json_response(json) do
  json.set! :albums do
    json.array! [@album] do |album|
      json.partial! 'album', album: album, media: @media
    end
  end
end
