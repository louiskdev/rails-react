json_response(json) do
  json.set! :albums do
    json.array! [@album] do |album|
      json.partial! 'album', album: album, media: @media
      json.partial! 'api/v1/shared/user', user: album.user
    end
  end
end
