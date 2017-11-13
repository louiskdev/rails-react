
json.set! :friends do
  json.array! users do |user|
    json.extract! user, :id, :first_name, :username
    json.profile_url user.username  # FIXME: profile_url -> username
    json.avatar_url user.avatar_url(:micro)
    json.missed_messages_count ::WheelChat::Notification.where(initiator_id: user.id, user_id: current_user.id).count
    json.online user.is_online_now?
    chat = ::WheelChat::Chat.find_by_users(user, current_user)
    chat ||= ::WheelChat::Chat.new(channel_name: ::WheelChat::Chat.channel_name_for_users(user, current_user))
    json.channel_name chat.channel_name
    last_message = chat.messages.last
    if last_message.nil?
      json.last_message ''
    else
      json.set! :last_message do
        json.text last_message.text
        json.date last_message.created_at
        json.author_id last_message.user_id
      end
    end
    json.set! :settings do
      json.extract! chat, :mute
    end
  end
end
