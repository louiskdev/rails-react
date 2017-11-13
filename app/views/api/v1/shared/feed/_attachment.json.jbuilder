unless medium.nil?
  json.video_links medium.attachmentable.try(:links) || []
  if medium.type == 'picture'
    json.picture_url medium.attachmentable.try(:file_url) || ''
    json.thumb_url ''
  else
    json.picture_url ''
    json.thumb_url medium.try(:thumb_url) || ''
  end
end
