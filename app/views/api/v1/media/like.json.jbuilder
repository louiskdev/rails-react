json_response(json) do
  json.set! :media do
    json.array! [@media] do |media|
      json.extract! media, :id
      json.partial! 'api/v1/shared/likes', object: media
    end
  end
end
