json_response(json) do
  json.commentable_type @commentable.class.name
  json.commentable_id   @commentable.id
  json.partial! 'api/v1/shared/comments', comments: @root_comments, total_count: @total_comments_count
end
