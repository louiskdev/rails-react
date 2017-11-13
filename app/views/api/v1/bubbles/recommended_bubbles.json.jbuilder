json_response(json) do
  json.set! :recommended_bubbles do
    json.array! @recommended_bubbles do |bubble|
      json.extract! bubble, :id, :name, :permalink
      json.members_count bubble.members.count
      json.first_interest bubble.interests.first.try(:name) || ''
      json.avatar_url bubble.avatar_url(:micro)
      json.partial! 'api/v1/shared/likes', object: bubble
    end
  end
end
