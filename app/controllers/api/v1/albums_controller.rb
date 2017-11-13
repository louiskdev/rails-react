class Api::V1::AlbumsController < ApplicationController
  before_action :find_album, only: :destroy

  def create
    @album = current_user.albums.build(album_params)
    if @album.save
      Activity.create(name: "albums.create", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                      object_id: @album.id, object_type: @album.class.name, privacy: Activity.privacies[:p_private],
                      feed: true, extra_data: {name: @album.name})
      render :create, status: :created
    else
      render 'api/v1/shared/failure', locals: {errors: [@album.errors]}, status: :unprocessable_entity
    end
  end

  def index
    @albums = current_user.albums.where(gallery_id: nil).order(updated_at: :desc)
    @avatars_count = current_user.avatars.count
    @default_avatar_url = current_user.avatar_url(:thumb)
  end

  def destroy
    if @album.user == current_user or (@album.gallery.present? and current_user.can_manage?(@album.gallery.bubble))
      if @album.media.empty?
        @album.destroy
        if @album.destroyed?
          Activity.create(name: "albums.destroy", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                          privacy: Activity.privacies[:p_private], feed: false, extra_data: {name: @album.name})
        end
        render 'api/v1/shared/empty_response'
      else
        render 'api/v1/shared/failure', locals: {errors: [{message: 'album is not empty'}]}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: 'access denied'}]}, status: :unauthorized
    end
  end

  private

  def album_params
    params.require(:album).permit(:name, :description)
  end

  def find_album
    @album = Album.find_by(id: params[:id])
    render 'api/v1/shared/failure', locals: {errors: [{message: 'album is not found'}]}, status: :not_found if @album.nil?
  end

end
