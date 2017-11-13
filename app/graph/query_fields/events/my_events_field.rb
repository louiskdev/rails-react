field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "myEvents"
  type EventType.connection_type
  description I18n.t('graphql.queries.myEvents.description')

  argument :start_date, types.String, I18n.t('graphql.queries.myEvents.args.start_date')
  argument :end_date, types.String, I18n.t('graphql.queries.myEvents.args.end_date')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      events = Event.joins(:event_members).where("event_members.user_id = #{user.id}")
      return custom_error('Events widget not found', ctx) if events.nil?

      if normalized_args[:start_date]
        events = events.where("start_date >= :value", value: normalized_args[:start_date])
      end
      if normalized_args[:end_date]
        events = events.where("start_date <= :value", value: normalized_args[:end_date])
      end
      events = events.order(updated_at: :desc)
      events
    end
  end

  def result_if_error_occurred
    []
  end

end

Events::MyEventsField = GraphQL::Relay::ConnectionField.create(field)
