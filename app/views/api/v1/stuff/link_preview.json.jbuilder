json_response(json) do
  json.set! :link_preview do
    if @link_data.nil?
      json.url params[:link]
      json.title params[:link]
      json.description ''
      json.picture_url ''
    else
      json.url @link_data.url.to_s rescue params[:link]
      json.title @link_data.title
      json.description @link_data.description
      json.picture_url @link_data.images.first.src.to_s rescue ''
    end
  end
end
