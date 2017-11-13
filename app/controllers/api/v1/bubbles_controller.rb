class Api::V1::BubblesController < ApplicationController
  skip_before_action :authenticate_user_from_token!, only: [:join_member]
  before_action :only_valid_user_has_access, except: [:show, :join_member]
  before_action :find_bubble, except: [:new, :create, :join_member, :my_bubbles, :recommended_bubbles]
  before_action :load_interests, only: [:new, :edit]
  before_action :generate_user_if_new_member, only: :show

  def show
    bm = @bubble.bubble_members.where(user_id: current_user.id).first if current_user
    if @bubble.privy? and bm.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Record not found or access denied' }]}, status: :not_found
    else
      if params[:new_member_token].present?
        render :show_by_token, locals: {bubble_member: bm}, status: :ok
      else
        render :show, locals: {bubble_member: bm}, status: :ok
      end
    end
  end

  def new
    @widgets = ["Gallery", "Chat", "Blog"]
  end

  def create
    @bubble = Bubble.new(bubble_params)
    if params[:widgets].present?
      if params[:widgets].is_a?(Array)
        params[:widgets].each do |name|
          widget = "Widgets::#{name.camelcase}Widget::#{name.camelcase}".constantize.new
          abstract_widget = Widget.new(widgetable: widget)
          @bubble.widgets << abstract_widget
        end
      else
        render 'api/v1/shared/failure', locals: {errors: [{message: 'widgets should be an array'}] }, status: :bad_request
      end
    end
    @bubble.invitable = @bubble.privy? ? true : false
    bm = @bubble.bubble_members.build(member: current_user, user_role: BubbleMember.user_roles[:owner])

    if @bubble.save
      apply_interests(params[:interests])
      if bm.save
        Activity.create(name: "bubbles.join_user", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @bubble.id, object_type: @bubble.class.name, bubble_id: @bubble.id, feed: true,
                        privacy: Activity.privacies[:p_private])
        render :create, locals: {bubble_member: bm}, status: :ok and return
      end
    else
      render 'api/v1/shared/failure', locals: {errors: @bubble.errors }, status: :unprocessable_entity
    end
  end

  def edit
    @bubble_member = @bubble.bubble_members.where(user_id: current_user.id).where("user_role < #{BubbleMember.user_roles[:guest]}").first
    if @bubble_member.nil?
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  def update
    @bubble_member = @bubble.bubble_members.where(user_id: current_user.id).where("user_role < #{BubbleMember.user_roles[:guest]}").first
    if @bubble_member.present?
      if @bubble.update_attributes(update_bubble_params)
        apply_interests(params[:interests])
        privacy = self.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "bubbles.update", user_id: current_user.id, user_ip: current_user.current_sign_in_ip, bubble_id: @bubble.id,
                        object_id: @bubble.id, object_type: @bubble.class.name, feed: true, privacy: privacy)
        render :edit, status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: @bubble.errors }, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  def destroy
    if @bubble.bubble_members.where(user_id: current_user.id, user_role: BubbleMember.user_roles[:owner]).first
      bubble_id = @bubble.id
      @bubble.destroy
      if @bubble.destroyed?
        Activity.create(name: "bubbles.destroy", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        feed: false, privacy: Activity.privacies[:p_private], extra_data: {name: @bubble.name}, bubble_id: bubble_id)
      end
      render 'api/v1/shared/empty_response', status: :ok
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  def my_bubbles
    params[:offset] = 0 if params[:offset].nil?
    @bubbles = if params[:count].present?
                 current_user.bubbles.offset(Integer(params[:offset])).limit(Integer(params[:count]))
               else
                 current_user.bubbles(Integer(params[:offset]))
               end
  rescue Exception => e
    render 'api/v1/shared/failure', locals: {errors: {message: 'Some error occurred. Request could not be processed', backtrace: e.backtrace} }, status: :bad_request
  end

  def recommended_bubbles
    params[:offset] = 0 if params[:offset].nil?
    @recommended_bubbles = if params[:count].present?
                             current_user.recommended_bubbles(Integer(params[:offset]), Integer(params[:count]))
                           else
                             current_user.recommended_bubbles(Integer(params[:offset]))
                           end
    render :recommended_bubbles, status: :ok
  rescue Exception => e
    render 'api/v1/shared/failure', locals: {errors: {message: 'Some error occurred. Request could not be processed', backtrace: e.backtrace} }, status: :bad_request
  end

  def upload_cover_image
    if params[:image].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'image' parameter should be present"}]}, status: :bad_request
      return
    end
    bm = @bubble.bubble_members.where(user_id: current_user.id, user_role: [BubbleMember.user_roles[:owner], BubbleMember.user_roles[:moderator]]).first
    if bm.present?
      @bubble.assign_attributes(crop_x: params[:crop_x], crop_y: params[:crop_y], crop_h: params[:crop_h],
                                crop_w: params[:crop_w], rotation_angle: params[:rotation_angle])
      if @bubble.apply_cover_image(params[:image], params[:filename]) and @bubble.save
        privacy = @bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "bubbles.upload_cover", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @bubble.id, object_type: @bubble.class.name, bubble_id: @bubble.id, feed: true, privacy: privacy)
        render :show, locals: {bubble_member: bm}, status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: [message: 'Some error']}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [message: 'Access denied']}, status: :unauthorized
    end
  end

  def upload_avatar
    if params[:image].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'image' parameter should be present"}]}, status: :bad_request
      return
    end
    bm = @bubble.bubble_members.where(user_id: current_user.id, user_role: [BubbleMember.user_roles[:owner], BubbleMember.user_roles[:moderator]]).first
    if bm.nil?
      render 'api/v1/shared/failure', locals: {errors: [message: 'Access denied']}, status: :unauthorized
      return
    end

    avatar = @bubble.build_avatar(crop_x: params[:crop_x], crop_y: params[:crop_y], crop_h: params[:crop_h],
                                  crop_w: params[:crop_w], rotation_angle: params[:rotation_angle], kind: :common)
    if avatar.add_picture(params[:image], params[:filename])
      if avatar.save
        privacy = @bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "bubbles.upload_avatar", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @bubble.id, object_type: @bubble.class.name, bubble_id: @bubble.id, feed: true, privacy: privacy)
        render :show, locals: {bubble_member: bm}, status: :created
      else
        render 'api/v1/shared/failure', locals: {errors: [{message: 'Avatar is not valid'}]}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Uploaded image is not valid'}]}, status: :unprocessable_entity
    end
  end

  def join_member
    bi = BubbleInvitation.find_by(token: params[:new_member_token])
    bm = bi.bubble.bubble_members.build(user_id: bi.new_member_id, user_role: BubbleMember.user_roles[:guest])
    if bm.save
      Notification.create(user_id: bi.bubble.owner.id, initiator_type: 'User', initiator_id: bi.new_member_id,
                          name: 'bubbles.join_user', text: 'Your bubble has new member',extra_data: { bubble_id: bi.bubble.id })
      activity = Activity.create(name: "bubbles.join_user", user_id: bi.new_member_id, bubble_id: bi.bubble.id, feed: true,
                 # extra_data: { added_by: "#{@bi.moderator.first_name} (#{@bi.moderator.username})" },  # FIXME: disabled for now
                 object_id: bi.bubble.id, object_type: bi.bubble.class.name, privacy: Activity.privacies[:p_private])
      activity.ignorings.create(user_id: activity.user_id)
      render :join_member, status: :ok
    else
      render :join_member, status: :unprocessable_entity
    end
  end

  def join_me
    if @bubble.invitable?
      render 'api/v1/shared/failure', locals: {errors: [{user: ["can join this bubble only by invite"]}] }, status: :unprocessable_entity
    elsif @bubble.bubble_members.where(user_id: current_user.id).first
      render 'api/v1/shared/failure', locals: {errors: [{user: ["is already a member of this bubble"]}] }, status: :unprocessable_entity
    else
      bm = @bubble.bubble_members.build(member: current_user, user_role: BubbleMember.user_roles[:guest], online: true)
      if bm.save
        Notification.create(
                            user_id: @bubble.owner.id,
                            initiator_type: 'User',
                            initiator_id: current_user.id,
                            name: 'bubbles.join_user',
                            text: 'has joined your bubble',
                            extra_data: {
                              bubble_id: @bubble.id,
                              bubble_avatar: @bubble.avatar_url
                              }
                            )
        activity = Activity.create(name: "bubbles.join_user", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                   object_id: @bubble.id, object_type: @bubble.class.name, bubble_id: @bubble.id, feed: true,
                   privacy: Activity.privacies[:p_private])
        activity.ignorings.create(user_id: activity.user_id)
        render :show, locals: {bubble_member: bm}, status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: bm.errors }, status: :unprocessable_entity
      end
    end
  end

  def disjoin_me
    if @bubble.owner == current_user
      render 'api/v1/shared/failure', locals: {errors: [{bubble: ["should have the owner"]}] }, status: :unprocessable_entity
    else
      bm = @bubble.bubble_members.where(user_id: current_user.id).first
      if bm.nil?
        render 'api/v1/shared/failure', locals: {errors: [{user: ["is not a member of this bubble"]}] }, status: :unprocessable_entity
      else
        bm.destroy
        if bm.destroyed?
          Notification.create(user_id: @bubble.owner.id, initiator_type: 'User', initiator_id: current_user.id,
                              name: 'bubbles.disjoin_user', text: 'left your bubble',extra_data: { bubble_id: @bubble.id, bubble_avatar: @bubble.avatar_url })
          activity = Activity.create(name: "bubbles.disjoin_user", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                     object_id: @bubble.id, object_type: @bubble.class.name, bubble_id: @bubble.id, feed: true,
                     privacy: Activity.privacies[:p_private])
          activity.ignorings.create(user_id: activity.user_id)
        end
        render :show, locals: {bubble_member: nil}, status: :ok
      end
    end
  end

  def disjoin
    if @bubble.bubble_members.where(user_id: current_user.id).where("user_role <= #{BubbleMember.user_roles[:moderator]}").first.nil?
      render 'api/v1/shared/failure', locals: {errors: [{you: ["have not permissions"]}] }, status: :unauthorized
    elsif @bubble.owner.id == params[:member_id].to_i
      render 'api/v1/shared/failure', locals: {errors: [{bubble: ["should have the owner"]}] }, status: :unprocessable_entity
    else
      bm = @bubble.bubble_members.where(user_id: params[:member_id]).first
      if bm.nil?
        render 'api/v1/shared/failure', locals: {errors: [{user: ["is not a member of this bubble"]}] }, status: :unprocessable_entity
      else
        bm.destroy
        if bm.destroyed?
          Notification.create(user_id: @bubble.owner.id, initiator_type: 'User', initiator_id: params[:member_id],
                              name: 'bubbles.disjoin_user', text: 'User was kicked from the bubble',extra_data: { bubble_id: @bubble.id })
          activity = Activity.create(name: "bubbles.disjoin_user", user_id: current_user.id, bubble_id: @bubble.id,
                     # extra_data: { removed_by: "#{current_user.first_name} (#{current_user.username})" },  # FIXME: disabled for now
                     object_id: @bubble.id, object_type: @bubble.class.name, feed: true, privacy: Activity.privacies[:p_private])
          activity.ignorings.create(user_id: activity.user_id)
        end
        render :show, locals: {bubble_member: nil}, status: :ok
      end
    end
  end

  # change member's role for current bubble
  def member
    if @bubble.owner == current_user
      if @bubble.owner.id != params[:member_id].to_i
        if ["guest", "moderator"].include? params[:new_role]
          bm = @bubble.bubble_members.find_by(user_id: params[:member_id])
          if bm.nil?
            render 'api/v1/shared/failure', locals: {errors: [{user: ["is not a member of this bubble"]}] }, status: :unprocessable_entity
          else
            bm.user_role = params[:new_role].to_sym
            if bm.save
              render 'api/v1/shared/empty_response', status: :ok
            else
              render 'api/v1/shared/failure', locals: {errors: bm.errors}, status: :unprocessable_entity
            end
          end
        else
          render 'api/v1/shared/failure', locals: {errors: [{new_role: ["is unknown"]}] }, status: :bad_request
        end
      else
        render 'api/v1/shared/failure', locals: {errors: [{you: ["can't change your role 'owner' for now"]}] }, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{you: ["have not permissions"]}] }, status: :unauthorized
    end
  end

  def members
    if params[:status].present?
      if params[:status] == 'online'
        # offline_members = @bubble.members.reject { |member| member == current_user or (member.bubble_members.where(bubble_id: @bubble.id).first.online? and member.is_online_now? and member.friend_of?(current_user)) }
        # offline_members = @bubble.members.reject { |member| member == current_user or (member.bubble_members.where(bubble_id: @bubble.id).first.online? and member.friend_of?(current_user)) }
        # @members = @bubble.members.reject { |member| offline_members.include?(member) }

        online_in_bubble_user_ids = Redis.current.smembers("bubblz:bubble_#{@bubble.permalink}:online_user_ids").map {|el| el.to_i }
        @members = User.where(id: online_in_bubble_user_ids.push(current_user.id))
        # @members = @bubble.members.where(id: online_member_ids.push(current_user.id))

      elsif params[:status] == 'offline'
        # @members = @bubble.members.reject { |member| member == current_user or (member.bubble_members.where(bubble_id: @bubble.id).first.online? and member.is_online_now? and member.friend_of?(current_user)) }
        # @members = @bubble.members.reject { |member| member == current_user or (member.bubble_members.where(bubble_id: @bubble.id).first.online? and member.friend_of?(current_user)) }

        online_member_ids = Redis.current.smembers("bubblz:bubble_#{@bubble.permalink}:online_user_ids").map {|el| el.to_i }
        @members = @bubble.members.where.not(id: online_member_ids.push(current_user.id))
      end
    else
      @members = @bubble.members
    end
  end

  def like
    if current_user.like! @bubble
      @bubble.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @bubble.class.name, object_id: @bubble.id,
      #                                                  likes_count: @bubble.likers_count, profile_url: current_user.username }  # FIXME: profile_url -> username

      Pusher.trigger('global', 'bubble_likes_count_changed', {message: {object_type: @bubble.class.name, object_id: @bubble.id,likes_count: @bubble.likers_count, username: current_user.username }})

      if current_user != @bubble.owner
        Notification.create(user_id: @bubble.owner.id, initiator_type: 'User', initiator_id: current_user.id,
                            name: "bubble:liked", text: "Your bubble was liked",extra_data: { bubble_id: @bubble.id })
      end
    end
  end

  def unlike
    if current_user.unlike! @bubble
      @bubble.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @bubble.class.name, object_id: @bubble.id,
      #                                                  likes_count: @bubble.likers_count, profile_url: current_user.username }  # FIXME: profile_url -> username

      Pusher.trigger('global', 'bubble_likes_count_changed', {message: {object_type: @bubble.class.name, object_id: @bubble.id, likes_count: @bubble.likers_count, username: current_user.username }})
    end
    render :like, status: :ok
  end

  def feed
    page_number = parse_page_param
    return if page_number.nil?
    limit = Integer(params[:count]) rescue 20
    offset = page_number * limit

    bm = @bubble.bubble_members.where(user_id: current_user.id).first
    if @bubble.privy? and bm.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Record not found or access denied' }]}, status: :not_found
    else
      @activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').
          where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND ignorings.user_id <> :user_id)', model: 'Activity', user_id: current_user.id).
          where(bubble_id: @bubble.id, feed: true)

      # processing a privacy filter
      get_posts_query_str = "activities.name = 'blogs.create_post'"
      if params[:privacy].present?
        available_privaces = ['friends', 'public']
        available_privaces << 'private' if @bubble.owner == current_user
        @activities = if available_privaces.include?(params[:privacy])
          @activities.where("activities.privacy = ? OR #{get_posts_query_str}", Activity.privacies["p_#{params[:privacy]}"])
        else
          @activities.where("activities.privacy IN (:privacies) OR #{get_posts_query_str}", privacies: [Activity.privacies[:p_friends], Activity.privacies[:p_public]])
        end
      else
        @activities = @activities.where("activities.privacy IN (:privacies) OR #{get_posts_query_str}", privacies: [Activity.privacies[:p_friends], Activity.privacies[:p_public]]) if @bubble.owner != current_user
      end

      @activities = if params[:sort_by] == 'popular'
                      @activities.to_a.sort_by! {|a| [(a.object.rating rescue 0), a.created_at] }.reverse!
                      @activities = @activities.slice(offset, limit+1)
                    else
                      @activities = @activities.order(created_at: :desc).offset(offset).limit(limit+1)
                    end

      if @activities.present?
        @load_more = if @activities.size == (limit + 1)
                       @activities = @activities.first(limit)
                       page_number > 0 # true
                     else
                       false
                     end

        @activities.each do |activity|
          activity.object.visits.create(user: current_user) rescue nil
        end
      else
        @load_more = false
      end
    end
  end

  private
  def bubble_params
    params.require(:bubble).permit(:name, :description, :kind, :zip_code)
  end

  def update_bubble_params
    params.require(:bubble).permit(:name, :description, :zip_code)
  end

  def find_bubble
    @bubble = Bubble.find_by(id: params[:id]) if params[:id].match(/\A\d+\z/)
    @bubble = Bubble.find_by(permalink: params[:id]) if @bubble.nil?
    if @bubble.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "Bubble not found"}]}, status: :not_found
    end
  end

  def only_valid_user_has_access
    render 'api/v1/shared/failure', locals: {errors: [{user: ["has incomplete profile"]}] }, status: :unauthorized if current_user.invalid?
  end

  def load_interests
    @interests = Interest.order(counter: :desc).limit(7)
  end

  def apply_interests(interest_names)
    interest_names ||= []
    interest_names.map do |interest_name|
      interest_name.strip!
      interest_name.downcase!
    end

    #destory non actual bubble_interests
    @bubble.interests.each do |interest|
      unless interest_names.include?(interest.name)
        BubbleInterest.where(bubble_id: @bubble.id, interest_id: interest.id).destroy_all
      end
    end

    # add new interests to bubble
    interest_names.each do |interest_name|
      interest = Interest.where(name: interest_name).first
      interest = Interest.create(name: interest_name) if interest.nil?
      if BubbleInterest.where(bubble_id: @bubble.id, interest_id: interest.id).blank?
        interest.bubbles << @bubble
        interest.save!
      end
    end
    @bubble.reload
  end

  def generate_user_if_new_member
    if params[:new_member_token].present?
      bi = BubbleInvitation.find_by_token(params[:new_member_token])
      if bi.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: "Invitation not found"}]}, status: :not_found
        return
      else
        new_password = Devise.friendly_token.first(8)
        user = User.find_by(email: bi.new_member_email)
        user = User.new(email: bi.new_member_email, first_name: bi.new_member_email.partition('@').first,
                         agree_to_terms: true, password: new_password, password_confirmation: new_password,
                         confirmed_at: DateTime.now, language: 'English', username: Devise.friendly_token.first(8)) if user.nil?
        user.bubble_members.build(bubble_id: bi.bubble_id, user_role: :guest) if user.new_record? || BubbleMember.find_by(bubble_id: bi.bubble_id, user_id: user.id).blank?
        user.save
        bi.update_attribute(:status, BubbleInvitation.statuses[:approved])
        sign_in :user, user, store: false
      end
    end
  end
end
