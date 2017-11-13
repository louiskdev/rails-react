json.extract! medium, :id, :title, :type, :created_at
json.partial! 'api/v1/shared/attachment', medium: medium
json.partial! 'api/v1/shared/likes', object: medium
json.visits_count medium.visits.count
json.comments_count medium.comment_threads.count
json.set! :user do
  json.first_name medium.uploader.first_name
  json.profile_url medium.uploader.username  # FIXME: profile_url -> username
  json.username medium.uploader.username
  json.thumb_avatar_url medium.uploader.avatar_url(:thumb)
end
if medium.album.nil?
  json.album ''
else
  json.set! :album do
    json.extract! medium.album, :id, :name
  end
end
