json_response(json) do
  json.set! :gallery do
    bubbles_count = 0
    json.set! :bubbles do
      json.array! @bubbles do |bubble|
        media_count = bubble.gallery_widget.media.where(user_id: current_user.id).size rescue 0
        next if media_count == 0
        json.extract! bubble, :id, :name, :invitable, :kind, :permalink
        json.avatar_url bubble.avatar_url(:thumb)
        json.media_count media_count
        bubbles_count += 1
      end
    end
    json.bubbles_count bubbles_count
  end
end
