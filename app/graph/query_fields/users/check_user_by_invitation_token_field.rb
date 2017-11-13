Users::CheckUserByInvitationTokenField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "checkUserByInvitationToken"
  type types.String
  description I18n.t('graphql.queries.checkUserByInvitationToken.description')

  argument :token, !types.String, I18n.t('graphql.queries.checkUserByInvitationToken.args.token')

  resolve -> (obj, args, ctx) do
    invitation = BubbleInvitation.find_by(token: args[:token])
    return custom_error('Invalid token', ctx) if invitation.nil?
    return custom_error('Invitation already accepted', ctx) if invitation.approved?
    return custom_error('Invitation already declined', ctx) if invitation.declined?

    if invitation.pending?
      bubble = invitation.bubble rescue nil
      return custom_error('Invalid invitation', ctx) if bubble.nil?

      user = if invitation.new_member_id
               invitation.new_member rescue nil
             else
               User.find_by(email: invitation.new_member_email)
             end

      if user.nil?
        if invitation.new_member_email.present?
          passwd = Devise.friendly_token.first(8)
          new_user = User.new(email: invitation.new_member_email,
                              password: passwd,
                              password_confirmation: passwd)
          new_user.skip_confirmation_notification!
          new_user.save(validate: false)
          new_user.confirm
          new_user.confirmation_token
        else
          add_custom_error('Invalid invitation', ctx)
        end
      elsif !user.completed?
        user.confirmation_token
      else
        # user already registered
        add_custom_error('User has completed profile', ctx)
      end
    else
      add_custom_error('Unknown invitation state', ctx)
    end
  end

  def result_if_error_occurred
    nil
  end

end
