Connections::ActionNotificatiosWithUnreadCountConnectionType = NotificationType.define_connection do
  name 'ActionNotificatiosWithUnreadCountConnection'

  field :unread_notifications_count do
    type !types.Int
    # `obj` is the Connection
    resolve -> (obj, args, ctx) do
      user = ctx[:current_user]
      if user.is_a?(User)
        user.unread_notifications.where("name LIKE 'friendships:%'").count
      else
        0
      end
    end
  end
end
