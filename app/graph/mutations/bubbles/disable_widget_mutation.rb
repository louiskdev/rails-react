Bubbles::DisableWidgetMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "disableWidget"
  description I18n.t('graphql.mutations.disableWidget.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.disableWidget.args.bubble_id')
  input_field :name, !types.String, I18n.t('graphql.mutations.disableWidget.args.name')

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      bubble = Bubble.find_by(id: inputs[:bubble_id])
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) unless user.is_owner_of?(bubble)

      begin
        bubble_widget = bubble.send("#{inputs[:name].downcase}_widget")
      rescue NoMethodError => ex
        return custom_error("Unknown widget '#{inputs[:name]}'", ctx)
      end

      return custom_error('Widget not found. Maybe it is disabled', ctx) if bubble_widget.nil?
      status = bubble_widget.widget.update(enabled: false)

      notify_bubble_members(bubble, inputs[:name].camelcase) if status
      {status: status}
    end
  end

  def notify_bubble_members(bubble, widget_name)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-bubble-#{bubble.permalink}",
        event: 'widget_disabled',
        data: {
            widget_name: widget_name
        },
        debug_info: {
            location: 'Bubbles::DisableWidgetMutation#notify_bubble_members',
            widget_name: widget_name,
            channel: "private-bubble-#{bubble.permalink}",
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
