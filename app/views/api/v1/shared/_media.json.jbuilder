json.set! :media do
  json.array! media do |medium|
    json.partial! 'api/v1/shared/medium', medium: medium
  end
end
json.media_count defined?(media_count) ? media_count : media.size
