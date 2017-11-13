json_response(json) do
  json.partial! 'api/v1/shared/notifications', notifications: @notifications
end