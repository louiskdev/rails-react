field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "interesting_bubbles"
  type BubbleType.connection_type
  description 'Get interesting bubbles'

  resolve -> (obj, args, ctx) {
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      bubbles = user.recommended_bubbles
      bubbles
    end
  }

  def result_if_error_occurred
    []
  end

end

Bubbles::InterestingBubblesField = GraphQL::Relay::ConnectionField.create(field)
