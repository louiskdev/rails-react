BubbleCountersResult = Struct.new(:feed_unread_items_count,
                                  :blog_unread_items_count,
                                  :chat_unread_items_count,
                                  :gallery_unread_items_count,
                                  :events_unread_items_count,
                                  :total_unread_items_count)

Bubbles::BubbleCountersField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name 'bubbleCounters'
  type BubbleCountersDataType
  description I18n.t('graphql.queries.bubbleCounters.description')

  argument :permalink, !types.String, I18n.t('graphql.queries.bubbleCounters.args.permalink')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    elsif !user.completed?
      add_custom_error('User has incomplete profile', ctx)
    else
      bubble = Bubble.find_by(permalink: args[:permalink])
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) if bubble.privy? and !user.is_member_of?(bubble)

      result = BubbleCountersResult.new
      result[:feed_unread_items_count] = bubble.feed_unread_items_count_by_user(user)
      result[:blog_unread_items_count] = bubble.blog_unread_items_count_by_user(user)
      result[:gallery_unread_items_count] = bubble.gallery_unread_items_count_by_user(user)
      result[:chat_unread_items_count] = bubble.chat_unread_items_count_by_user(user)
      result[:events_unread_items_count] = bubble.events_unread_items_count_by_user(user)
      result[:total_unread_items_count] = bubble.total_unread_items_count_by_user(user)

      result
    end
  end

  def result_if_error_occurred
    nil
  end

end
