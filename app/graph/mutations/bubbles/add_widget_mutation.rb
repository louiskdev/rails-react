Bubbles::AddWidgetMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "addWidget"
  description I18n.t('graphql.mutations.addWidget.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.addWidget.args.bubble_id')
  input_field :name, !types.String, I18n.t('graphql.mutations.addWidget.args.name')

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

      name = inputs[:name]
      full_widget_name = "Widgets::#{name.camelcase}Widget::#{name.camelcase}"
      widget = Widget.unscoped.find_by(widgetable_type: full_widget_name, bubble_id: bubble.id)

      if widget.nil?
        begin
          custom_widget = full_widget_name.constantize.new
        rescue NameError => ex
          return custom_error("Unknown widget '#{name}'", ctx)
        end
        widget = Widget.new(widgetable: custom_widget, bubble: bubble)
        status = widget.save
      elsif widget.enabled?
        return custom_error("Widget '#{name}' is already active", ctx)
      else
        status = widget.update(enabled: true)
      end

      notify_bubble_members(bubble, name.camelcase) if status
      {status: status}
    end
  end

  def notify_bubble_members(bubble, new_widget_name)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-bubble-#{bubble.permalink}",
        event: 'widget_added',
        data: {
            widget_name: new_widget_name
        },
        debug_info: {
            location: 'Bubbles::AddWidgetMutation#notify_bubble_members',
            widget_name: new_widget_name,
            channel: "private-bubble-#{bubble.permalink}",
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {status: false}
  end

end
