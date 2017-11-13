json_response(json) do
  json.set! :messages do
    json.array! [@chat_message] do |message|
      json.extract! message, :id, :text, :created_at, :video_url
      json.attachment_url image_url('small_logo.png')
      json.video_links []
      json.video_thumbnail ''
      json.channel_name params[:source_area]
      json.user_name current_user.first_name
      json.user_profile_url current_user.username  # FIXME: profile_url -> username
      json.user_avatar_url current_user.avatar_url
    end
  end
end
