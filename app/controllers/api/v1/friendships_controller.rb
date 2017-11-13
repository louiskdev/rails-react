class Api::V1::FriendshipsController < ApplicationController
  before_action :find_friend
  before_action :find_friendship, only: [:update, :destroy]

  def create
    friendship = @friend.friendships.create(friend_id: current_user.id, status: Friendship.statuses[:pending])
    unless friendship.save
      render 'api/v1/shared/failure', locals: {errors: friendship.errors}, status: :unprocessable_entity
    end
  end

  def update
    if params[:status].present?
      case params[:status]
        when 'approved'
          if @friendship.update(status: Friendship.statuses[:approved])
            if @inverse_friendship.nil?
              @friend.friendships.create(friend_id: current_user.id, status: Friendship.statuses[:approved])
            else
              @inverse_friendship.update(status: Friendship.statuses[:approved])
            end
            if params[:notification_id].present?
              Notification.delete_all(id: params[:notification_id].to_i)
              # ActionCable.server.broadcast "user_#{@friendship.user_id}", message: 'need_to_reload_notifications'
              Pusher.trigger("private-user-#{@friendship.user_id}", 'important', message: 'need_to_reload_notifications')
            end
          end
        when 'declined'
          if @friendship.present?
            @friendship.destroy
            if @friendship.destroyed? and params[:notification_id].present?
              Notification.delete_all(id: params[:notification_id].to_i)
              # ActionCable.server.broadcast "user_#{@friendship.user_id}", message: 'need_to_reload_notifications'
              Pusher.trigger("private-user-#{@friendship.user_id}", 'important', message: 'need_to_reload_notifications')
            end
          end
        when 'blocked'
          @friendship.update(status: Friendship.statuses[:blocked])
          if @inverse_friendship.nil?
            @friend.friendships.create(friend_id: current_user.id, status: Friendship.statuses[:pending])
          else
            @inverse_friendship.update(status: Friendship.statuses[:pending])
          end
      end
      render 'api/v1/shared/empty_response'
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: "'status' parameter should be present"}]}, status: :bad_request
    end
  end

  def destroy
    if @friendship.present?
      @friendship.destroy
      if @friendship.destroyed? and @friendship.pending?
        Notification.destroy_all(user_id: @friendship.user_id, initiator_id: @friendship.friend_id, initiator_type: 'User', name: 'friendships:create')
        # ActionCable.server.broadcast "user_#{@friendship.user_id}", message: 'need_to_reload_notifications'
        Pusher.trigger("private-user-#{@friendship.user_id}", 'important', message: 'need_to_reload_notifications')
        Notification.destroy_all(user_id: @friendship.friend_id, initiator_id: @friendship.user_id, initiator_type: 'User', name: 'friendships:decline')
        # ActionCable.server.broadcast "user_#{@friendship.friend_id}", message: 'need_to_reload_notifications'
        Pusher.trigger("private-user-#{@friendship.friend_id}", 'important', message: 'need_to_reload_notifications')
      end
    end

    if @inverse_friendship.present?
      @inverse_friendship.destroy
      if @inverse_friendship.destroyed? and @inverse_friendship.pending?
        Notification.destroy_all(user_id: @inverse_friendship.user_id, initiator_id: @inverse_friendship.friend_id, initiator_type: 'User', name: 'friendships:create')
        # ActionCable.server.broadcast "user_#{@inverse_friendship.user_id}", message: 'need_to_reload_notifications'
        Pusher.trigger("private-user-#{@inverse_friendship.user_id}", 'important', message: 'need_to_reload_notifications')
        Notification.destroy_all(user_id: @inverse_friendship.friend_id, initiator_id: @inverse_friendship.user_id, initiator_type: 'User', name: 'friendships:decline')
        # ActionCable.server.broadcast "user_#{@inverse_friendship.friend_id}", message: 'need_to_reload_notifications'
        Pusher.trigger("private-user-#{@inverse_friendship.friend_id}", 'important', message: 'need_to_reload_notifications')
      end
    end
    render :create, status: :ok
  end

  private

  def find_friend
    if params[:friend_id].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'friend_id' parameter should be present"}]}, status: :bad_request
    else
      @friend = User.find_by(id: params[:friend_id])
      if @friend.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: "User not found"}]}, status: :not_found
      end
    end
  end

  def find_friendship
    @friendship = Friendship.find_by(user_id: current_user.id, friend_id: @friend.id)
    @inverse_friendship = Friendship.find_by(user_id: @friend.id, friend_id: current_user.id)
  end

end
