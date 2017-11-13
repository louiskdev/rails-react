json_response(json) do
  json.set! :bubbles do
    json.array! @bubbles do |bubble|
      json.extract! bubble, :id, :name, :kind, :permalink
      json.members_count bubble.members.count
      json.first_interest bubble.interests.first.try(:name) || ''
      json.avatar_url bubble.avatar_url(:micro)
      json.partial! 'api/v1/shared/likes', object: bubble
    end
  end
end
