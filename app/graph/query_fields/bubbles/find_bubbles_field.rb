field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "findBubbles"
  type BubbleType.connection_type
  description 'Bubbles search by keywords and location.'

  argument :keywords, !types.String.to_list_type
  argument :zip_code, types.String
  argument :radius, types.Int

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)

      # find interest ids by keywords
      interest_ids = []
      normalized_args[:keywords].each do |keyword|
        keyword_dcase = keyword.downcase
        interest_ids << Interest.find_by("name ILIKE ?", "#{keyword_dcase}%").try(:id)

        # increment freq field value
        Suggestion.where(keyword: [keyword, keyword_dcase]).each do |suggestion|
          suggestion.update_attribute(:freq, suggestion.freq + 1)
        end
      end

      # find bubbles
      own_bubble_ids = user.bubbles.pluck(:id)
      query_string = generate_query_string(normalized_args[:keywords], interest_ids)

      # find public bubbles
      bubbles_query = Bubble.distinct.common
      # bubbles_query = bubbles_query.where.not(id: own_bubble_ids)
      if normalized_args[:zip_code].present?
        radius = normalized_args[:radius] || 0
        bubbles_query = radius.positive? ? bubbles_query.near(normalized_args[:zip_code], radius) : bubbles_query.near(normalized_args[:zip_code])
      end
      bubbles_query = bubbles_query.where(query_string) if query_string
      public_bubbles = bubbles_query.all

      # find global bubbles
      global_bubbles_query = Bubble.distinct.global
      # global_bubbles_query = global_bubbles_query.where.not(id: own_bubble_ids)
      global_bubbles_query = global_bubbles_query.where(query_string) if query_string
      global_bubbles = global_bubbles_query.all

      bubbles = global_bubbles | public_bubbles
      # bubbles
      result = bubbles.sort { |bubble| own_bubble_ids.include?(bubble.id) ? -1 : 1 }
      result
    end
  end

  def generate_bubble_names_subquery(keywords)
    return nil if keywords.blank?

    keywords.map {|el| %Q{ bubbles.name ILIKE #{ActiveRecord::Base.sanitize("%#{el}%")}} }.join(' AND ')
  end

  def get_bubble_ids_by_interest_ids(interest_ids)
    return [] if interest_ids.blank?

    BubbleInterest.select('bubble_id').where(interest_id: interest_ids).group('bubble_id').
        having("count(*) = #{interest_ids.size}").pluck(:bubble_id)
  end

  def generate_query_string(keywords, interest_ids)
    bubbles_by_name_sql = generate_bubble_names_subquery(keywords)
    bubble_ids_by_interests = get_bubble_ids_by_interest_ids(interest_ids)

    query_string = if bubble_ids_by_interests.present?
                     ids = bubble_ids_by_interests.join(',')
                     bubbles_by_name_sql ? "(bubbles.id IN (#{ids})) OR (#{bubbles_by_name_sql})" : "(bubbles.id IN (#{ids}))"
                   else
                     bubbles_by_name_sql ? "(#{bubbles_by_name_sql})" : nil
                   end

    query_string
  end

  def result_if_error_occurred
    []
  end
end

Bubbles::FindBubblesField = GraphQL::Relay::ConnectionField.create(field)
