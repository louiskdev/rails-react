field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "myNotifications"
  type Connections::NotificatiosWithUnreadCountConnectionType
  description I18n.t('graphql.queries.myNotifications.description')

  argument :status, types.String, I18n.t('graphql.queries.myNotifications.args.status')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?
    return custom_error('Unknown status', ctx) unless ['read', 'unread', '', nil].include?(args[:status])

    normalized_args = normalize_input_data(args)
    notifs = case normalized_args[:status]
               when 'unread' then user.unread_notifications
               when 'read' then user.received_notifications.where.not(read_at: nil).order(created_at: :desc)
               else
                 user.received_notifications.order(created_at: :desc)
             end
    notifs = notifs.where.not("name LIKE 'friendships:%'")

    notifs
  end

  def result_if_error_occurred
    []
  end
end

Notifications::MyNotificationsField = GraphQL::Relay::ConnectionField.create(field)
