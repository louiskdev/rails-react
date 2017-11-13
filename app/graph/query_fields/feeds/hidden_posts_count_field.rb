HiddenPostsCountResult = Struct.new(:count)

Feeds::HiddenPostsCountField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "hidden_posts_count"
  type HiddenPostsCountType
  description I18n.t('graphql.queries.hiddenPostsCount.description')

  argument :location, !types.String, I18n.t('graphql.queries.hiddenPostsCount.args.location')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      hidden_posts_count = Ignoring.where(user_id: user.id, location: args[:location]).count
      result = HiddenPostsCountResult.new
      result[:count] = hidden_posts_count
      result
    end
  end

  def result_if_error_occurred
    []
  end

end
