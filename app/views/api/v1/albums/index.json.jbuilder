json_response(json) do
  json.set! :albums do
    json.array! @albums do |album|
      json.extract! album, :id, :name, :updated_at
      json.thumb_avatar_url album.avatar_url(:thumb)
      json.media_count album.media.count
      json.partial! 'api/v1/shared/user', user: album.user
    end
  end
  json.set! :avatars_album do
    json.default_avatar_url @default_avatar_url
    json.avatars_count @avatars_count
  end
  json.albums_count @albums.size + 1  # +avatars_album
end
