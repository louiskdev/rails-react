WheelChat::ChatField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "wheelchat"
  type WheelChat::ChatType
  description 'Get wheelchat data'

  argument :channel_name, !types.String

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      # check channel name
      begin
        user_ids = args[:channel_name].split('_')
        raise ArgumentError if Integer(user_ids[0]) >= Integer(user_ids[1])
      rescue ArgumentError => ae
        add_custom_error('Channel name is invalid', ctx)
      end

      chat = ::WheelChat::Chat.find_or_initialize_by(channel_name: args[:channel_name])
      if chat.has_member?(user)
        chat
      else
        add_custom_error('Access denied', ctx)
      end
    end
  end


  def result_if_error_occurred
    nil
  end

end
