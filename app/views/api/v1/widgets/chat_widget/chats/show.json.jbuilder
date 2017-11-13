json_response(json) do
  json.set! :chat do
    json.online_users @online_users_count
    json.total_users @members.count
    json.partial! 'api/v1/shared/bubble_members', members: @members
    json.partial! 'api/v1/widgets/chat_widget/chats/online_users', users: @online_users
  end
end