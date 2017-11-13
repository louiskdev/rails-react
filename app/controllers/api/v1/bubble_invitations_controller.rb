class Api::V1::BubbleInvitationsController < ApplicationController
  skip_before_action :authenticate_user_from_token!, only: :generate_user

  def create
    if params[:email].present? and params[:username].present?
      render 'api/v1/shared/failure', locals: {errors: [{message: "you send both 'email' and 'username' parameters. Only one is allowed"}] }, status: :bad_request
    end
    bubble = Bubble.find(params[:bubble_id])
    if params[:email].blank? and params[:username].blank?  # user send request to join himself
      originator_info = { new_member_id: current_user.id, originator: BubbleInvitation.originators[:new_member] }
    else    # invite another member
      if bubble.privy? and bubble.bubble_members.where(user_id: current_user.id).where("bubble_members.user_role <= #{BubbleMember.user_roles[:moderator]}").first.nil?
        render 'api/v1/shared/failure', locals: {errors: [{user: ["is not a moderator of this bubble"]}] }, status: :unprocessable_entity
        return
      end
      originator_info = { moderator_id: current_user.id, originator: BubbleInvitation.originators[:moderator] }

      login = params[:email]     if params[:email].present?
      login = params[:username]  if params[:username].present?
      new_member = User.find_by_login(login)

      if new_member.nil?  # member is not registered
        if params[:username].present?
          render 'api/v1/shared/failure', locals: {errors: [{user: ["not found by username #{params[:username]}"]}] }, status: :not_found
          return
        end
        originator_info.merge!(new_member_email: params[:email]) if params[:email].present?
      else  # member is registered
        originator_info.merge!(new_member_id: new_member.id)
      end
    end

    if bubble.bubble_members.where(user_id: originator_info[:new_member_id]).first
      render 'api/v1/shared/failure', locals: {errors: [{user: ["is already a member of this bubble"]}] }, status: :unprocessable_entity
    else
      bi = bubble.bubble_invitations.build({ status: :pending }.merge(originator_info))
      if bi.save
        InvitationMailer.join_new_member_to_bubble(bi).deliver_later if bi.moderator?
        render 'api/v1/shared/empty_response', status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: bi.errors }, status: :unprocessable_entity
      end
    end
  end

  def update
    @bi = BubbleInvitation.find_by(token: params[:new_member_token])
    if @bi.moderator_id.nil?   # bubble's moderator should approve or decline
      if @bi.bubble.bubble_members.where(user_id: current_user.id).where("user_role < #{BubbleMember.user_roles[:guest]}").first
        if @bi.update_attributes(moderator_id: current_user.id, status: params[:new_status])
          if @bi.approved?
            InvitationMailer.join_new_member_to_bubble(@bi).deliver
          end
          render 'api/v1/shared/empty_response', status: :ok
        else
          render 'api/v1/shared/failure', locals: {errors: @bi.errors }, status: :unprocessable_entity
        end
      else
        render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
      end

    elsif @bi.new_member_id.present? # new (registered) member should approve or decline invite
      if @bi.new_member_id == current_user.id
        if params[:new_status] == 'approved'
          if bm = BubbleMember.create(bubble_id: @bi.bubble.id, user_id: current_user.id, user_role: :guest)
            Notification.create(user_id: @bi.moderator_id, initiator_type: 'User', initiator_id: @bi.new_member_id,
                                name: "invitation:accepted", text: "accepted your invitation to join bubble",
                                extra_data: { bubble_id: @bi.bubble_id, bubble_avatar: @bi.bubble.avatar_url })
            Notification.create(user_id: @bi.bubble.owner.id, initiator_type: 'User', initiator_id: @bi.new_member_id,
                                name: 'bubbles.join_user', text: 'has new member',extra_data: { bubble_id: @bi.bubble.id, bubble_avatar: @bi.bubble.avatar_url })
            activity = Activity.create(name: "bubbles.join_user", user_id: @bi.new_member_id, bubble_id: @bi.bubble.id, feed: true,
                       # extra_data: { added_by: "#{@bi.moderator.first_name} (#{@bi.moderator.username})" },  # FIXME: disabled for now
                       object_id: @bi.bubble.id, object_type: @bi.bubble.class.name, privacy: Activity.privacies[:p_private])
            activity.ignorings.create(user_id: activity.user_id)
          else
            render 'api/v1/shared/failure', locals: {errors: bm.errors }, status: :unprocessable_entity
            return
          end
        elsif params[:new_status] == 'declined'
          Notification.create(user_id: @bi.moderator_id, initiator_type: 'User', initiator_id: @bi.new_member_id,
                              name: "invitation:declined", text: "declined your invitation to join bubble",
                              extra_data: { bubble_id: @bi.bubble_id, bubble_avatar: @bi.bubble.avatar_url })
        end
        if @bi.update_attributes(status: params[:new_status])
          @bi.notification.update_attribute(:read_at, DateTime.now) if @bi.notification.present?
          BubbleInvitation.where(bubble_id: @bi.bubble_id, new_member_id: @bi.new_member_id, status: BubbleInvitation.statuses[:pending]).all.each do |pbi|
            pbi.update_attributes(status: params[:new_status])
            pbi.notification.update_attribute(:read_at, DateTime.now) if pbi.notification.present?
          end
          current_user.reload
          @notifications = current_user.unread_notifications
          @friends = current_user.friends
          # render 'api/v1/users/unread_notifications', status: :ok
          render :update, status: :ok
        else
          render 'api/v1/shared/failure', locals: {errors: @bi.errors }, status: :unprocessable_entity
        end
      else
        render 'api/v1/shared/failure', locals: {errors: [unexpected: 'error'] }, status: :unprocessable_entity
      end

    else  # new (UNregistered) member should approve or decline invite
      render 'api/v1/shared/failure', locals: {errors: [not: 'implemented'] }, status: :not_implemented
    end
  end

  def generate_user
    if params[:new_member_token].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'new_member_token' parameter should be present"}]}, status: :bad_request
    else
      bi = BubbleInvitation.find_by_token(params[:new_member_token])
      if bi.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: "Record not found"}]}, status: :not_found
      else
        new_password = Devise.friendly_token.first(8)
        @user = User.new(email: bi.new_member_email, first_name: bi.new_member_email.partition('@').first,
                         agree_to_terms: true, password: new_password, password_confirmation: new_password,
                         confirmed_at: DateTime.now )
        @user.bubble_members.build(bubble_id: bi.bubble_id, user_role: :guest)
        @user.save
        bi.update_attribute(:status, BubbleInvitation.statuses[:approved])
        sign_in :user, @user, store: false
        render :generate_user, status: :created
      end
    end

  end

end
