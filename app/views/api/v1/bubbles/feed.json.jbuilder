json_response(json) do
  json.partial! 'api/v1/shared/bubble_activities', activities: @activities
end