json_response(json) do
  json.set! :media do
    json.array! @collection do |medium|
      json.extract! medium, :id, :title, :type, :created_at
      json.uploader medium.uploader.first_name
      json.partial! 'api/v1/shared/user', user: medium.uploader
      json.partial! 'api/v1/shared/attachment', medium: medium
      json.partial! 'api/v1/shared/likes', object: medium
    end
  end
  json.media_count @media_count
end
