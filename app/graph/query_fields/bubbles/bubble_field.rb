Bubbles::BubbleField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "bubble"
  type BubbleType
  description 'Get bubble details by permalink'

  argument :permalink, !types.String
  argument :new_member_token, types.String

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      return custom_error('User is unauthorized', ctx)
    end
    unless user.completed?
      return custom_error('User has incomplete profile', ctx)
    end

    bubble = Bubble.find_by(permalink: args[:permalink])
    if bubble.nil?
      return custom_error('Bubble not found or access denied', ctx)
    end

    bm = bubble.bubble_members.where(user_id: user.id).first
    if bubble.privy? and bm.nil? and args[:new_member_token].blank?
      return custom_error('Bubble not found or access denied', ctx)
    else
      bubble
    end
  end

  def result_if_error_occurred
    nil
  end

end
