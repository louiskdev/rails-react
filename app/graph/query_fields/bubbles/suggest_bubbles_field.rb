field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "suggestBubbles"
  type BubbleType.connection_type
  description 'Suggest bubbles by name.'

  argument :keyword, !types.String

  resolve -> (obj, args, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      bubbles = Bubble.common_or_global.where("name ILIKE :word", word: "%#{normalized_args[:keyword]}%")

      own_bubble_ids = current_user.bubbles.ids
      result = bubbles.sort { |bubble| own_bubble_ids.include?(bubble.id) ? -1 : 1 }
      result
    end
  end

  def result_if_error_occurred
    []
  end
end

Bubbles::SuggestBubblesField = GraphQL::Relay::ConnectionField.create(field)
