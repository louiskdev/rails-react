unless medium.nil?
  json.thumb_url medium.try(:thumb_url) || ''
  json.video_links medium.attachmentable.try(:links) || []
  if medium.type == 'picture'
    json.picture_url medium.attachmentable.try(:file_url) || ''
  else
    json.picture_url ''
  end
end