json_response(json) do
  json.extract! @bubble, :name, :description, :invitable, :kind, :permalink
  json.partial! 'api/v1/shared/widgets', widgets: @bubble.widgets
end