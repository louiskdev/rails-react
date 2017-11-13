field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)
  
  name "suggestions"
  type types.String.connection_type
  description 'It returns keywords registered in the app.'

  argument :pattern, types.String

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      suggestions = Suggestion.order(freq: :desc)

      # apply pattern arg
      if normalized_args[:pattern].present?
        suggestions = suggestions.where('keyword ILIKE ?', "%#{normalized_args[:pattern]}%")
      end

      keywords = suggestions.pluck(:keyword)
      keywords
    end
  end

  def result_if_error_occurred
    []
  end

end

Suggestions::SuggestionsField = GraphQL::Relay::ConnectionField.create(field)
