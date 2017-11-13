json_response(json) do
  json.set! :blog do
    json.set! :posts do
      json.partial! 'api/v1/widgets/blog_widget/posts/post', post: @post, trim: false
      if @post.video_attachment.present?
        json.thumb_url   ActionController::Base.helpers.asset_path("small_logo.png", type: :image)
        json.video_links []
      end
    end
  end
end
