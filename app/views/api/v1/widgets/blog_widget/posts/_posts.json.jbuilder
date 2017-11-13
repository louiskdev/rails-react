json.set! :posts do
  json.array! posts do |post|
    json.partial! 'api/v1/widgets/blog_widget/posts/post', post: post, trim: (trim rescue false)
  end
end
json.posts_count @blog.posts.count
