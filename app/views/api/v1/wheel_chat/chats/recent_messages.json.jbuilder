json_response(json) do
  json.set! :settings do
    json.extract! @chat, :mute
  end
  json.set! :messages do
    json.array! @messages do |message|
      json.extract! message, :id, :text, :created_at, :video_url
      json.video_links message.video_attachment.try(:links) || []
      json.video_thumbnail message.video_attachment.try(:thumbnail) || ''
      json.attachment_url message.picture_attachment.try(:file_url) || ''
      if message.user_id
        user = User.select(:id, :first_name, :username, :default_avatar_id).where(id: message.user_id).first
        if user
          user_name = user.first_name
          user_profile_url = user.username # FIXME: profile_url -> username
          user_avatar_url = user.avatar_url(:micro)
        else
          user_name = 'Removed user'
          user_profile_url = ''
          user_avatar_url = Avatar.new.picture_url(:micro)
        end
      else
        user_name = user_profile_url = user_avatar_url = ''
      end
      json.user_name user_name
      json.user_profile_url user_profile_url
      json.user_avatar_url user_avatar_url
      json.partial! 'api/v1/shared/link_preview', link_preview: message.link_previews.first
    end
  end
end
