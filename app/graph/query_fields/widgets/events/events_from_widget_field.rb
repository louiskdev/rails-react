field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "eventsFromWidget"
  type EventType.connection_type
  description I18n.t('graphql.queries.eventsFromWidget.description')

  argument :events_widget_id, !types.Int, I18n.t('graphql.queries.eventsFromWidget.args.events_widget_id')
  argument :start_date, types.String, I18n.t('graphql.queries.eventsFromWidget.args.start_date')
  argument :end_date, types.String, I18n.t('graphql.queries.eventsFromWidget.args.end_date')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      events = Widgets::EventsWidget::Events.find_by(id: args[:events_widget_id])
      return custom_error('Events widget not found', ctx) if events.nil?

      bubble = events.bubble
      return custom_error('Bubble not found', ctx) if bubble.nil?

      if bubble.privy? and !user.is_member_of?(bubble)
        return custom_error('Access denied', ctx)
      else
        query = events.events

        # UNREAD EVENTS FEATURE
        attendance_attrs = {url: "/bubbles/#{bubble.permalink}", section: "bubble_events"}
        attendance = user.attendances.find_by(attendance_attrs)

        if attendance.nil?
          user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now))
        else
          attendance.update(latest_date: DateTime.now)
        end
        # UNREAD EVENTS FEATURE

        normalized_args = normalize_input_data(args)
        if normalized_args[:start_date]
          query = query.where("start_date >= :value", value: normalized_args[:start_date])
        end
        if normalized_args[:end_date]
          query = query.where("start_date <= :value", value: normalized_args[:end_date])
        end
        query = query.order(updated_at: :desc)

        # send realtime notification
        user.notify_unread_items_count_changed(bubble)

        query
      end

    end
  end

  def result_if_error_occurred
    []
  end

end

Widgets::Events::EventsFromWidgetField = GraphQL::Relay::ConnectionField.create(field)
