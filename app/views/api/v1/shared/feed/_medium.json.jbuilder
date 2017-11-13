json.extract! medium, :id, :title, :type, :created_at
json.gallery_id medium.gallery.try(:id) || ''
json.partial! 'api/v1/shared/feed/attachment', medium: medium
# json.partial! 'api/v1/shared/user', user: medium.uploader
json.partial! 'api/v1/shared/album', album: medium.album
json.partial! 'api/v1/shared/likes', object: medium
json.visits_count medium.visits.count
json.comments_count medium.comment_threads.count
json.partial! 'api/v1/shared/feed/extra_fields', activity: activity
if medium.gallery.present?
  json.set! :bubble do
    bubble = medium.gallery.bubble
    json.id bubble.try(:id) || ''
    json.name bubble.try(:name) || ''
    json.permalink bubble.try(:permalink) || ''
  end
else
  json.bubble ''
end
