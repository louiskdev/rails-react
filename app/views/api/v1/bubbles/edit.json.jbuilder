json_response(json) do
  json.extract! @bubble, :id, :name, :description, :invitable, :kind, :zip_code, :permalink
  json.avatar_url @bubble.avatar_url
  json.avatar_url @bubble.avatar_url(:thumb)
  json.cover_image_url @bubble.cover_image_url
  json.user_role @bubble_member.present? ? @bubble_member.user_role : "guest"
  json.members_count bubble.members.count
  json.partial! 'api/v1/shared/likes', object: @bubble
  json.partial! 'api/v1/shared/interests', interests: @bubble.interests
  json.partial! 'api/v1/shared/widgets', widgets: @bubble.widgets
  json.partial! 'api/v1/shared/bubble_activities', activities: Activity.where(object_type: 'Bubble', object_id: @bubble.id).to_a
  json.partial! 'api/v1/shared/bubble_members', members: @bubble.members

  json.set! :popular_interests do
    json.array! @interests do |interest|
      json.extract! interest, :name
      json.display_as interest.name # FIXME: remove display_as
    end
  end
end
