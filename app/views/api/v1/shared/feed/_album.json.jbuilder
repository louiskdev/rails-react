json.extract! album, :id, :name
json.thumb_avatar_url album.avatar_url(:thumb)
json.gallery_id album.gallery.try(:id) || ''
# json.partial! 'api/v1/shared/user', user: album.user
json.partial! 'api/v1/shared/feed/extra_fields', activity: activity
