
json.set! :bubbles do
  json.array! bubbles do |bubble|
    json.extract! bubble, :id, :name, :description, :invitable, :kind, :permalink
    json.avatar_url bubble.avatar_url(:thumb)
    json.cover_image_url bubble.cover_image_url
    json.user_role bubble_member.present? ? bubble_member.user_role : ""
    json.members_count bubble.members.count
    json.partial! 'api/v1/shared/likes', object: bubble
    json.partial! 'api/v1/shared/interests', interests: bubble.interests
    json.partial! 'api/v1/shared/widgets', widgets: bubble.widgets

    widget_gallery_id = bubble.gallery_widget.id rescue ''
    json.widget_gallery_id widget_gallery_id
    widget_chat_id = bubble.chat_widget.id rescue ''
    json.widget_chat_id widget_chat_id
    widget_blog_id = bubble.blog_widget.id rescue ''
    json.widget_blog_id widget_blog_id
  end
end
