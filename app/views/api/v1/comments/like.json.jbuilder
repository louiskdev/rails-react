json_response(json) do
  json.set! :comments do
    json.array! [@comment] do |comment|
      json.extract! comment, :id
      json.partial! 'api/v1/shared/likes', object: comment
    end
  end
end
