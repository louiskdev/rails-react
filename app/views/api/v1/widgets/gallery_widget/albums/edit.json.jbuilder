json_response(json) do
  json.set! :albums do
    json.array! [@album] do |album|
      json.extract! album, :id, :name, :description, :updated_at
      json.thumb_avatar_url album.avatar_url(:thumb)
      json.partial! 'api/v1/shared/user', user: album.user
    end
  end
end