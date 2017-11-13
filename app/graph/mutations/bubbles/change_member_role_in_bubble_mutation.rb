Bubbles::ChangeMemberRoleInBubbleMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "changeMemberRoleInBubble"
  description I18n.t('graphql.mutations.changeMemberRoleInBubble.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.changeMemberRoleInBubble.args.bubble_id')
  input_field :member_id, !types.Int, I18n.t('graphql.mutations.changeMemberRoleInBubble.args.member_id')
  input_field :new_role, !types.String, I18n.t('graphql.mutations.changeMemberRoleInBubble.args.new_role')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('User is not an owner of this bubble', ctx) unless user.is_owner_of?(bubble)

    member = bubble.members.find_by(id: inputs[:member_id])
    return custom_error('Member not found', ctx) if member.nil?

    new_role = inputs[:new_role].downcase
    return custom_error("Member already has a role `#{new_role}`", ctx) if new_role == member.role_in_bubble(bubble)

    case new_role
      when 'guest', 'moderator'
        status = member.bubble_members.find_by(bubble_id: bubble.id).update(user_role: BubbleMember.user_roles[new_role])
      when 'owner'
        ActiveRecord::Base.transaction do
          user.bubble_members.find_by(bubble_id: bubble.id).update!(user_role: BubbleMember.user_roles['moderator'])
          member.bubble_members.find_by(bubble_id: bubble.id).update!(user_role: BubbleMember.user_roles['owner'])
        end
        status = member.is_owner_of?(bubble)
      else
        return custom_error("Unknown role `#{inputs[:new_role]}`", ctx)
    end

    notify_bubble_members(bubble) if status
    {status: status}
  end

  def result_if_error_occurred
    {status: false}
  end

  def notify_bubble_members(bubble)
    ws_msg = {
        adapter: 'pusher',
        channel: "private-bubble-#{bubble.permalink}",
        event: 'need_refresh',
        data: {
          message: 'member_role_changed',
        },
        debug_info: {
            location: 'Bubbles::ChangeMemberRoleInBubbleMutation#notify_bubble_members',
            channel: "private-bubble-#{bubble.permalink}",
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
