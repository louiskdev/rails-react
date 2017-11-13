json_response(json) do
  json.partial! 'api/v1/shared/notifications', notifications: @notifications
  json.partial! 'api/v1/users/friends', users: @friends
end
