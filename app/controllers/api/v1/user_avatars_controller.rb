class Api::V1::UserAvatarsController < ApplicationController
  before_action :find_avatar, only: [:destroy, :set_default]

  def create
    if params[:image].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'image' parameter should be present"}]}, status: :bad_request
      return
    end
    @user = current_user
    avatar = @user.avatars.build(avatar_params)
    if avatar.add_picture(params[:image], params[:filename])
      if avatar.save
        @user.default_avatar = avatar
        @user.save
        render 'api/v1/users/show', status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: avatar.errors}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Image is not valid'}]}, status: :unprocessable_entity
    end
  end

  def index
  end

  def set_default
    current_user.update(default_avatar_id: params[:id])
    render :default_avatar, status: :ok
  end

  def destroy
    if current_user.avatars.count == 1
      render 'api/v1/shared/failure', locals: {errors: [{user: 'should have at least ONE avatar'}]}, status: :unprocessable_entity and return
    end
    @avatar.destroy
    if current_user.default_avatar_id == @avatar.id
      current_user.update(default_avatar_id: current_user.avatars.first.id)
    end
    render :default_avatar, status: :ok
  end

  private

  def find_avatar
    @avatar = current_user.avatars.where(id: params[:id]).first
    if @avatar.nil?
      render 'api/v1/shared/failure', locals: {errors: [{avatar: 'is not owned by the current user'}]}, status: :unprocessable_entity and return
    end
  end

  def avatar_params
    params.require(:user_avatar).permit(:kind, :crop_x, :crop_y, :crop_w, :crop_h, :rotation_angle)
  end
end
