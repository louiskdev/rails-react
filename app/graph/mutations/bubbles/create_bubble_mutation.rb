Bubbles::CreateBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createBubble"
  description 'Bubble creation'

  # Accessible from `input` in the resolve function:
  input_field :name, !types.String
  input_field :type, !types.String
  input_field :zip_code, !types.String
  input_field :description, types.String
  input_field :avatar, types.String
  input_field :avatar_filename, types.String
  input_field :widgets, types.String.to_list_type, '', default_value: []
  input_field :interests, types.String.to_list_type, '', default_value: []

  # resolve must return a hash with these keys
  return_field :bubble, BubbleType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      bubble = Bubble.new(bubble_params(normalized_inputs))

      # apply widgets
      if normalized_inputs[:widgets].present?
        if normalized_inputs[:widgets].is_a?(Array)
          normalized_inputs[:widgets].each do |name|
            next if name.blank?

            if name == 'Default'
              ['Blog', 'Chat', 'Gallery', 'Events'].each do |defwidget|
                begin
                  widget = "Widgets::#{defwidget.camelcase}Widget::#{defwidget.camelcase}".constantize.new
                rescue NameError => ex
                  return add_custom_error("Unknown widget '#{defwidget}'", ctx)
                end
                abstract_widget = Widget.new(widgetable: widget)
                bubble.widgets << abstract_widget
                if defwidget == 'Chat'
                  widget.create_default_channel(user.id)
                end
              end
            else
              begin
                widget = "Widgets::#{name.camelcase}Widget::#{name.camelcase}".constantize.new
              rescue NameError => ex
                return add_custom_error("Unknown widget '#{name}'", ctx)
              end
              abstract_widget = Widget.new(widgetable: widget)
              bubble.widgets << abstract_widget
            end
          end
        else
          return add_custom_error('Widgets argument should be an array', ctx)
        end
      end

      bubble.invitable = bubble.privy? ? true : false
      bm = bubble.bubble_members.build(member: user, user_role: BubbleMember.user_roles[:owner])
      if bubble.save
        bm.save
        bubble.apply_interests(normalized_inputs[:interests]) if normalized_inputs[:interests].present?
        user.apply_avatar_to_bubble(bubble, normalized_inputs[:avatar], normalized_inputs[:avatar_filename]) unless normalized_inputs[:avatar].nil?

        {bubble: bubble}
      else
        return_errors(bubble, ctx)
      end
    end
  }

  def bubble_params(inputs)
    { name: inputs[:name],
      kind: Bubble.normalize_kind_attr(inputs[:type]),
      zip_code: inputs[:zip_code],
      description: inputs[:description] }
  end

  def result_if_error_occurred
    {bubble: nil}
  end
end
