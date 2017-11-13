field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'user_bubbles'
  type BubbleType.connection_type
  description 'Get bubbles of some user'

  argument :username, !types.String
  argument :random, types.Boolean
  argument :keyword, types.String

  resolve -> (obj, args, ctx) do
    if ctx[:current_user].blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      user = User.find_by(username: normalized_args[:username])
      if user.nil?
        add_custom_error('User not found', ctx)
      else
        bubbles = user.bubbles.common_or_global  # public bubbles

        # apply 'random' arg
        if normalized_args[:random].present?
          bubbles = bubbles.order("RANDOM()")
        end

        # apply 'keyword' arg
        if normalized_args[:keyword].present?
          bubbles = bubbles.where('name ILIKE ?', "%#{normalized_args[:keyword]}%")
        end

        bubbles
      end
    end
  end

  def result_if_error_occurred
    []
  end
end

Bubbles::UserBubblesField = GraphQL::Relay::ConnectionField.create(field)
