Widgets::Chat::ChatField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "chat_widget"
  type -> { Widgets::ChatWidget::ChatType }
  description 'Get chat widget data'

  argument :id, !types.ID, "Chat widget ID or bubble permalink"

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    chat = ::Widgets::ChatWidget::Chat.find_by(id: args[:id])
    chat ||= Bubble.find_by(permalink: args[:id]).try(:chat_widget)
    return custom_error('Chat widget not found', ctx) if chat.nil?
    bubble = chat.widget.bubble
    return custom_error('Access denied', ctx) unless user.is_member_of?(bubble)

    # UNREAD MESSAGES FEATURE
    attendance_attrs = {url: "/bubbles/#{bubble.permalink}", section: "bubble_chat"}
    attendance = user.attendances.find_by(attendance_attrs)

    if attendance.nil?
      user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now))
    else
      attendance.update(latest_date: DateTime.now)
    end
    # UNREAD MESSAGES FEATURE

    # send realtime notification
    user.notify_unread_items_count_changed(bubble)

    chat
  end


  def result_if_error_occurred
    nil
  end

end
