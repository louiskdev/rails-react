Bubbles::SendBubbleInvitationMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "sendBubbleInvitation"
  description I18n.t('graphql.mutations.sendBubbleInvitation.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.sendBubbleInvitation.args.bubble_id')
  input_field :email, types.String, I18n.t('graphql.mutations.sendBubbleInvitation.args.email')
  input_field :username, types.String, I18n.t('graphql.mutations.sendBubbleInvitation.args.username')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    normalized_inputs = normalize_input_data(inputs)

    if normalized_inputs[:email].present? && normalized_inputs[:username].present? || normalized_inputs[:email].blank? && normalized_inputs[:username].blank?
      return custom_error('Request must contain one of the following params: `email` or `username`', ctx)
    end

    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: normalized_inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    if bubble.privy?
      return custom_error('Access denied', ctx) unless user.can_manage?(bubble)
    else
      return custom_error('Access denied', ctx) unless user.is_member_of?(bubble)
    end

    originator_info = { moderator_id: user.id, originator: BubbleInvitation.originators[:moderator] }
    login = normalized_inputs[:email] || normalized_inputs[:username]
    new_member = User.find_by_login(login)
    if new_member.nil?  # member is not registered

      if Rails.configuration.respond_to?(:user_invites_limit) and Rails.configuration.user_invites_limit.is_a?(Fixnum)
        return custom_error('User depleted his/her invitations', ctx) if user.user_invites_count >= Rails.configuration.user_invites_limit
      end

      if normalized_inputs[:username].present?
        return custom_error("User not found by username `#{login}`", ctx)
      else
        # validate email
        mock_user = User.new(email: normalized_inputs[:email])
        mock_user.validate
        return custom_error("Email `#{normalized_inputs[:email]}` is invalid", ctx) if mock_user.errors.has_key?(:email)

        originator_info.merge!(new_member_email: normalized_inputs[:email])
      end
    else  # member is registered
      return custom_error("User `#{login}` is already a member of this bubble", ctx) if new_member.is_member_of?(bubble)

      bu = bubble.blocked_users.find_by(id: new_member.id)
      return custom_error("User `#{login}` is banned from this bubble", ctx) if bu.present?

      originator_info.merge!(new_member_id: new_member.id)
    end

    bi = bubble.bubble_invitations.build({ status: :pending }.merge(originator_info))
    if bi.save
      if bi.moderator? and (new_member.nil? or !new_member.completed?)
        # if current user sends an invitation to that new member for the first time
        email = bi.new_member_email || User.find_by(id: bi.new_member_id).try(:email)
        if BubbleInvitation.where(moderator_id: bi.moderator_id).where('new_member_id = ? OR new_member_email = ?', bi.new_member_id, email).count == 1
          user.increment!(:user_invites_count)
        end
        InvitationMailer.join_new_member_to_bubble(bi).deliver_later
      end
      {status: true}
    else
      return_errors(bi, ctx)
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
