json_response(json) do
  json.set! :messages do
    json.array! [@message] do |message|
      json.id message[:id]
      json.created_at message[:created_at]
      json.text message[:text]
      json.attachment_url message[:attachment_url]
      json.video_links message[:video_links]
      json.video_thumbnail message[:video_thumbnail]
      json.set! :user do
        json.first_name message[:user_name]
        json.profile_url message[:user_profile_url]
        json.username message[:user_profile_url]
        json.thumb_avatar_url message[:user_avatar_url]
      end

      json.link_preview message[:link_preview]
    end
  end
end
