json_response(json) do
  json.set! :gallery do
    json.albums_count @albums.count
    json.set! :albums do
      json.array! @albums do |album|
        json.extract! album, :id, :name, :description, :updated_at
        json.thumb_avatar_url album.avatar_url(:thumb)
        json.partial! 'api/v1/shared/user', user: album.user
        json.partial! 'api/v1/widgets/gallery_widget/media/media', media: @media_groups[album.id], media_count: album.media.count
      end
    end
  end
end
