json_response(json) do
  json.set! :albums do
    json.array! @albums do |album|
      json.extract! album, :id, :name, :description, :updated_at
      json.thumb_avatar_url album.avatar_url(:thumb)
      json.media_count album.media.count
    end
  end
end