json_response(json) do
  json.set! :users do
    json.array! [current_user] do |user|
      json.extract! user, :id, :first_name, :username
      json.profile_url user.username  # FIXME: profile_url -> username
      json.access_token user.api_key.access_token
      json.avatar_url user.avatar_url(:thumb)
      json.is_completed user.valid?
      friends = user.friends.sort { |a, b| [(b.is_online_now? ? 1 : 0), b.last_wheelchat_message_date(user)] <=> [(a.is_online_now? ? 1 : 0), a.last_wheelchat_message_date(user)] }
      json.partial! 'api/v1/users/friends', users: friends
      json.friends_count friends.size
      json.bubbles_count user.bubbles.count

      # picture count in galleries
      json.pictures_count user.media.where(attachmentable_type: 'Attachments::Picture', mediable_type: ['Widgets::GalleryWidget::Gallery', nil]).count
      json.partial! 'api/v1/shared/interests', interests: user.interests
      json.partial! 'api/v1/shared/notifications', notifications: user.unread_notifications.all

      json.set! :recommended_bubbles do
        json.array! user.recommended_bubbles do |bubble|
          json.extract! bubble, :id, :name, :permalink
          json.members_count bubble.members.count
          json.first_interest bubble.interests.first.try(:name) || ''
          json.avatar_url bubble.avatar_url(:micro)
          json.partial! 'api/v1/shared/likes', object: bubble
        end
      end

    end
  end
end
