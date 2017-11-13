Activities::ActivityField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "activity"
  type ActivityType
  description 'Get activity entity by ID'

  argument :id, !types.Int

  resolve -> (obj, args, ctx)  do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      activity = Activity.find_by(id: args[:id])
      return custom_error('Record not found', ctx) if activity.nil? or !activity.feed? # feed = false -> activity is invisible

      if activity.bubble_id.nil?
        return custom_error('Record not found', ctx) if activity.user_id.nil?
        if activity.user_id != user.id
          return custom_error('Record not found', ctx) if activity.p_private?
          friend_ids = User.find_by(id: activity.user_id).friends.ids rescue []
          return custom_error('Record not found', ctx) unless friend_ids.include?(user.id)
        end
      else
        bubble = Bubble.find_by(id: activity.bubble_id)
        return custom_error('Record not found', ctx) if bubble.nil?
        return custom_error('Record not found', ctx) if bubble.privy? and !(user.is_member_of?(bubble) or user.id == activity.user_id)
      end

      activity
    end
  end

  def result_if_error_occurred
    nil
  end

end

