if link_preview.nil?
  json.link_preview ''
else
  json.set! :link_preview do
    json.extract! link_preview, :id, :title, :description, :url, :picture_url
  end
end
