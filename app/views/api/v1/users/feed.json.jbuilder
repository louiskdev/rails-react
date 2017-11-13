json_response(json) do
  json.partial! 'api/v1/users/feed', activities: @activities, feed_type: params[:type], unread_activities_count: @unread_activities_count
end
