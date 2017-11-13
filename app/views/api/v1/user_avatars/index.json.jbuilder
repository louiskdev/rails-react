json_response(json) do
  json.set! :avatars do
    json.array! current_user.avatars do |avatar|
      json.extract! avatar, :id, :kind
      json.name avatar.picture.file.filename
      json.url avatar.try(:picture_url, :thumb) || '/assets/defaults/thumb_default_avatar.jpg'
    end
  end
end