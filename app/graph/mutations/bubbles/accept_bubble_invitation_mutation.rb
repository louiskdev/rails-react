Bubbles::AcceptBubbleInvitationMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "acceptBubbleInvitation"
  description I18n.t('graphql.mutations.acceptBubbleInvitation.description')

  # Accessible from `input` in the resolve function:
  input_field :token, !types.String, I18n.t('graphql.mutations.acceptBubbleInvitation.args.token')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean
  return_field :confirmation_token, types.String

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    confirmation_token = nil
    status = false
    current_user = ctx[:current_user]

    bi = BubbleInvitation.find_by(token: inputs[:token])
    return custom_error('Invalid token', ctx) if bi.nil?

    user = if bi.new_member_id
             bi.new_member rescue nil
           else
             User.find_by(email: bi.new_member_email)
           end

    return custom_error('Access denied', ctx) if current_user.present? and current_user != user
    return custom_error('Invitation already accepted', ctx) if bi.approved?
    return custom_error('Invitation already declined', ctx) if bi.declined?

    if bi.pending?
      bubble = bi.bubble rescue nil
      return custom_error('Invalid invitation', ctx) if bubble.nil?

      # check user
      if user.nil?
        if bi.new_member_email.present?
          passwd = Devise.friendly_token.first(8)
          user = User.new(email: bi.new_member_email,
                          password: passwd,
                          password_confirmation: passwd)
          user.skip_confirmation_notification!
          user.save(validate: false)
          user.confirm
          confirmation_token = user.confirmation_token
        else
          return custom_error('Invalid invitation', ctx)
        end
      elsif !user.completed?
        confirmation_token = user.confirmation_token
      end

      # accept invitation & join bubble
      if bi.moderator_id.present?
        return custom_error('User is already a member of this bubble', ctx) if user.is_member_of?(bubble)

        bm = BubbleMember.create(bubble_id: bi.bubble_id, user_id: user.id, user_role: :guest)
        if bm.persisted?
          bi.update(status: 'approved')
          status = true
        else
          return_errors(bm, ctx)
        end
      end

      {status: status, confirmation_token: confirmation_token}
    else
      add_custom_error('Unknown invitation state', ctx)
    end
  end

  def result_if_error_occurred
    {status: false, confirmation_token: nil}
  end
end
