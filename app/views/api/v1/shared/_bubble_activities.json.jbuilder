json.set! :feed do
  json.array! activities do |activity|
    json.partial! 'api/v1/shared/feed/activity_base_template', activity: activity, feed_type: 'bubbles'
  end
end
json.set! :load_more, (@load_more || false)