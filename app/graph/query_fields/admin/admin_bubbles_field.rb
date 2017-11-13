AdminBubblesResult = Struct.new(:success, :bubbleCreateCount, :bubbleJoinCount, :totalPrivateBubbles, :totalPublicBubbles)

Admin::AdminBubblesField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "adminBubbles"
  type Admin::AdminBubbleInfoType
  description I18n.t('graphql.queries.adminBubbles.args.description')

  resolve -> (obj, args, ctx)  do
    user = ctx[:current_user]
    if user.nil?
      return add_custom_error('User is unauthorized', ctx)
    elsif user.admin == 0
      return add_custom_error('User is unauthorized', ctx)
    else
      result = AdminBubblesResult.new
      result[:success] = true
      result[:bubbleCreateCount] = Bubble.all.count
      result[:bubbleJoinCount] = BubbleMember.all.count
      result[:totalPrivateBubbles] = Bubble.where(kind: Bubble.kinds[:privy]).count
      result[:totalPublicBubbles] = Bubble.where('kind = :global_kind OR kind = :common_kind',
        global_kind: Bubble.kinds[:global],
        common_kind: Bubble.kinds[:common]
        ).count
      result
    end
  end

  def result_if_error_occurred
    result = AdminBubblesResult.new
    result[:success] = false
    result
  end

end
