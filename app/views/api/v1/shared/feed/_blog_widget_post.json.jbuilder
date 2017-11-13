json.extract! post, :id, :created_at
if trim and post.text.present? and post.text.length > 400
  json.trimmed_text truncate(post.text, length: 400)
  json.text ''
else
  json.trimmed_text ''
  json.text post.text
end
json.set! :blog do
  json.id post.blog.try(:id) || ''
  bubble = post.blog.bubble rescue nil
  json.blog_name bubble.try(:name) || ''
  json.blog_permalink bubble.try(:permalink) || ''
end
avg_rating, raters_count = post.rating_info
json.rating avg_rating
json.raters_count raters_count
user_rating = post.rating_from(current_user) rescue nil
json.user_rating user_rating || ''
json.partial! 'api/v1/shared/feed/attachment', medium: post.media.first
# json.partial! 'api/v1/shared/user', user: post.user
json.partial! 'api/v1/shared/likes', object: post
json.partial! 'api/v1/shared/link_preview', link_preview: post.link_previews.first
json.visits_count post.visits.count
json.comments_count post.comment_threads.count
json.partial! 'api/v1/shared/feed/extra_fields', activity: activity
