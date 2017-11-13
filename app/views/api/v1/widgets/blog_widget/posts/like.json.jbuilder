json_response(json) do
  json.set! :posts do
    json.array! [@post] do |post|
      json.extract! post, :id
      json.partial! 'api/v1/shared/likes', object: post
    end
  end
end
