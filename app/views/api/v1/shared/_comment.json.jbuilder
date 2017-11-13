json.extract! comment, :id, :body, :created_at #, :subject, :title
json.set! :author do
  json.name comment.user.first_name
  json.username comment.user.username
  json.micro_avatar_url comment.user.avatar_url(:micro)
end
json.partial! 'api/v1/shared/likes', object: comment
json.partial! 'api/v1/shared/comments', comments: comment.children
