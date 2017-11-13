json_response(json) do
  json.set! :blog do
    json.set! :posts do
      json.partial! 'api/v1/widgets/blog_widget/posts/post', post: @post, trim: false
    end
  end
end
