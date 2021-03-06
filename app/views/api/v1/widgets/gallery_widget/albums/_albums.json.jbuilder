
json.set! :albums do
  json.array! albums do |album|
    json.extract! album, :id, :name, :description, :updated_at
    json.thumb_avatar_url album.avatar_url(:thumb)
    json.partial! 'api/v1/shared/user', user: album.user
    json.partial! 'api/v1/widgets/gallery_widget/media/media', media: album.media, media_count: album.media.count
  end
end
