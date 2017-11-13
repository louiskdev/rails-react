json.extract! medium, :id, :title, :type, :created_at
json.partial! 'api/v1/shared/attachment', medium: medium
json.partial! 'api/v1/shared/user', user: medium.uploader
json.partial! 'api/v1/shared/album', album: medium.album
json.partial! 'api/v1/shared/likes', object: medium
json.visits_count medium.visits.count
json.comments_count medium.comment_threads.count
