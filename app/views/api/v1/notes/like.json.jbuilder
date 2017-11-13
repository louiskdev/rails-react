json_response(json) do
  json.set! :notes do
    json.array! [@note] do |note|
      json.extract! note, :id
      json.partial! 'api/v1/shared/likes', object: note
    end
  end
end
