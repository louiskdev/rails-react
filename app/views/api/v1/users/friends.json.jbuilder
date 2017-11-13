json_response(json) do
  json.partial! 'api/v1/users/friends', users: @friends
  json.load_more @load_more
end
