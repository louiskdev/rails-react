json.set! :comments do
  json.array! comments do |comment|
    json.partial! 'api/v1/shared/comment', comment: comment
  end
end
json.comments_count(defined?(total_count) ? total_count : comments.size)
