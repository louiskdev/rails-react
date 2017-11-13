class InvitationMailer < ApplicationMailer

  def join_new_member_to_bubble(bubble_invitation)
    @bubble_invitation = bubble_invitation
    bubble = Bubble.find(bubble_invitation.bubble_id)
    @bubble_permalink = bubble.permalink
    @bubble_name = bubble.name
    moderator = User.find(bubble_invitation.moderator_id)
    @moderator_name = moderator.first_name
    @moderator_gender = moderator.gender
    receiver = if @bubble_invitation.new_member_email.present?
                 User.find_by(email: @bubble_invitation.new_member_email)
               else
                 User.find_by(id: @bubble_invitation.new_member_id)
               end
    
    return if receiver.nil?
    
    target_email = receiver.email
    @confirmation_token = receiver.completed? ? nil : receiver.confirmation_token
    
    mail(to: target_email, subject: "<MyBubblz.com> Invite") unless target_email.nil?
  end
end
