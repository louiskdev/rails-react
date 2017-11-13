json_response(json) do
  json.partial! 'bubble', bubbles: [@bubble], bubble_member: bubble_member
end