field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'my_bubbles'
  type BubbleType.connection_type
  description 'Get bubbles of current user'

  argument :random, types.Boolean
  argument :keyword, types.String
  argument :ids, types[types.ID]

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      bubbles = user.bubbles.order('LOWER(name)')

      # apply 'ids' arg
      if normalized_args[:ids].present?
        bubbles = bubbles.where(id: normalized_args[:ids])
      end

      # apply 'random' arg
      if normalized_args[:random].present?
        bubbles = bubbles.reorder("RANDOM()")
      end

      # apply 'keyword' arg
      if normalized_args[:keyword].present?
        bubbles = bubbles.where('name ILIKE ?', "%#{normalized_args[:keyword]}%")
      end

      bubbles
    end
  end

  def result_if_error_occurred
    []
  end
end

Bubbles::MyBubblesField = GraphQL::Relay::ConnectionField.create(field)
