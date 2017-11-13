json_response(json) do
  json.set! :blog do
    json.extract! @blog, :id
    json.set! :load_more, (@load_more || false)
    json.partial! 'api/v1/widgets/blog_widget/posts/posts', posts: @posts, trim: true
  end
end
