json_response(json) do
  json.set! :users do
    json.array! [@user] do |user|
      json.extract! user, :id, :first_name, :username, :gender, :zip_code
      json.profile_url user.username  # FIXME: profile_url -> username
      json.avatar_url user.avatar_url(:thumb)
      # json.cover_image_url user.cover_image_url
      json.friendship_status 'approved'
      json.age ((Time.now - user.birthday.to_time) / 1.year).to_i
      json.friends_count user.friends.count
      json.bubbles_count user.bubbles.count
      # picture count in galleries
      json.pictures_count user.media.where(attachmentable_type: 'Attachments::Picture', mediable_type: ['Widgets::GalleryWidget::Gallery', nil]).count
      json.partial! 'api/v1/shared/interests', interests: user.interests
      json.partial! 'api/v1/users/feed', activities: @activities, feed_type: 'friends', unread_activities_count: 0
    end
  end
end
