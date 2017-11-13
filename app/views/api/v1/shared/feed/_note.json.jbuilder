json.extract! note, :id, :private, :created_at
if trim and note.text.present? and note.text.length > 400
  json.trimmed_text truncate(note.text, length: 400)
  json.text ''
else
  json.trimmed_text ''
  json.text note.text
end
json.blog_id ''
avg_rating, raters_count = note.rating_info
json.rating avg_rating
json.raters_count raters_count
user_rating = note.rating_from(current_user) rescue nil
json.user_rating user_rating || ''
json.partial! 'api/v1/shared/feed/attachment', medium: note.media.first
# json.partial! 'api/v1/shared/user', user: note.user
json.partial! 'api/v1/shared/likes', object: note
json.partial! 'api/v1/shared/link_preview', link_preview: note.link_previews.first
json.visits_count note.visits.count
json.comments_count note.comment_threads.count
