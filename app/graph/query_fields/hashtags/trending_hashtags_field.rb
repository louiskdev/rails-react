field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "trendingHashtags"
  type HashtagType.connection_type
  description 'Get trending #hashtags'

  resolve -> (obj, args, ctx) do
    if ctx[:current_user].nil?
      add_custom_error('User is unauthorized', ctx)
    else
      Hashtag.order(posts_count: :desc)
    end
  end

  def result_if_error_occurred
    []
  end

end

Hashtags::TrendingHashtagsField = GraphQL::Relay::ConnectionField.create(field)
