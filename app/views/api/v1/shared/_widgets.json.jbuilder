json.set! :widgets do
  json.array! widgets do |widget|
    json.id widget.widgetable_id
    json.name widget.name
    if widget.name == "Gallery" and widget.widgetable.present?
      gallery = widget.widgetable
      json.albums_count gallery.albums.count
      json.media_count gallery.media.count
      latest_media = gallery.latest_media(5)
      json.set! :latest_media do
        json.array! latest_media do |media|
          json.username media.uploader.first_name rescue ''
          json.profile_url media.uploader.username rescue ''   # FIXME: profile_url -> username
          json.username media.uploader.username rescue ''
          json.album_name media.album.name rescue ''
          json.created_at media.created_at || ''
          json.thumb_media_url media.thumb_url || ''
          # json.media_url media.attachment_url || ''
        end
      end
    elsif widget.name == "Chat" and widget.widgetable.present?
      json.online_users widget.widgetable.users.reject {|user| !user.is_online_now? }.count
    end
  end
end
