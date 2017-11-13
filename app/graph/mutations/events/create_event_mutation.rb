Events::CreateEventMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createEvent"
  description 'Event creation'

  # Accessible from `input` in the resolve function:
  input_field :name, !types.String
  input_field :avatar, types.String
  input_field :avatar_filename, types.String
  input_field :type, !types.String
  input_field :start_date, !types.String
  input_field :address, !types.String
  input_field :description, types.String
  input_field :bubble_id, types.Int

  # resolve must return a hash with these keys
  return_field :event, EventType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)

      # date check
      existing_events = Event.where(start_date: normalized_inputs[:start_date]).first
      return custom_error('An event was already created at that time', ctx) unless existing_events.blank?

      event = Event.new(event_params(normalized_inputs))
      event.likers_count = 0
      event.owner_id = user.id

      if normalized_inputs[:bubble_id].present?
        bubble = Bubble.find_by(id: normalized_inputs[:bubble_id])
        return custom_error('Bubble not found', ctx) if bubble.nil?
        return custom_error('Associated events widget not found', ctx) if bubble.events_widget.nil?
        # return custom_error('Access denied', ctx) unless user.can_manage?(bubble)
        event.events_id = bubble.events_widget.id

        em = event.event_members.build(member: user, user_role: EventMember.user_roles[:owner])
        if event.save
          em.save
          event.apply_avatar(normalized_inputs[:avatar], normalized_inputs[:avatar_filename], user.id) if normalized_inputs[:avatar].present?

          notify_event_created(event)
          send_notifications(event, user)

          {event: event}
        else
          return_errors(event, ctx)
        end
      else
        add_custom_error('Bubble not found', ctx)
      end
    end
  }

  def notify_event_created(event)
    # notify creator that an event is created
    members = []
    event.members.map do |member|
      members.push({
        id: member.id,
        username: member.username,
        avatar_url: member.avatar_url,
      })
    end

    # real-time notification
    # Pusher.trigger("private-event-#{event.permalink}", 'member_joined', member: new_user_data)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-event-owner-#{event.owner.id}",
        event: 'event_created',
        data: {
            id: event.id,
            name: event.name,
            type: event.kind,
            avatar_url: event.avatar_url,
            permalink: event.permalink,
            address: event.address,
            description: event.description,
            start_date: event.start_date.strftime("%Y-%m-%d %H:%M:%S"),
            likes_count: event.likers_count,
            members_count: event.members_count,
            members: {
              edges: members,
            },
            events_widget_id: event.events.id,
        },
        debug_info: {
            location: 'event#notify_event_created',
            event_id: event.id,
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def send_notifications(event, sender)
    event.events.bubble.members.map do |member|
      if member.id != sender.id
        Notification.create(user_id: member.id,
          initiator_type: 'User',
          initiator_id: sender.id,
          object_type: 'Event',
          object_id: event.id,
          name: 'events.create'
        )
      end
    end
  end

  def event_params(inputs)
    { name: inputs[:name],
      permalink: inputs[:permalink],
      cover_image: inputs[:cover_image],
      kind: inputs[:type],
      start_date: inputs[:start_date],
      address: inputs[:address],
      description: inputs[:description] }
  end

  def result_if_error_occurred
    {event: nil}
  end

end
