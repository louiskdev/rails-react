Widgets::Chat::ChannelField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "chat_widget_channel"
  type -> { Widgets::ChatWidget::ChannelType }
  description 'Get chat widget channel data'

  argument :id, !types.ID, "Chat widget ID or bubble permalink"

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    channel = ::Widgets::ChatWidget::Channel.find_by(id: args[:id])

    chat = channel.chat
    chat ||= Bubble.find_by(permalink: args[:id]).try(:chat_widget)
    return custom_error('Chat widget not found', ctx) if chat.nil?
    bubble = chat.widget.bubble
    return custom_error('Access denied', ctx) unless user.is_member_of?(bubble)

    channel
  end


  def result_if_error_occurred
    nil
  end

end
