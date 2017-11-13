class Api::V1::Widgets::GalleryWidget::AlbumsController < ApplicationController
  before_action :find_gallery
  before_action :find_album, except: [:index, :create]

  def index
    @albums = @gallery.albums
  end

  def show
    page_number = parse_page_param
    return if page_number.nil?
    media_offset = page_number * Medium::ITEMS_PER_PAGE
    @albums = @gallery.albums
    @media = @album.media.newest.offset(media_offset).limit(Medium::ITEMS_PER_PAGE)

    @media.each do |media|
      media.visits.create(user: current_user)
    end
  end

  def create
    if current_user.is_member_of?(@gallery.bubble)
      @album = @gallery.albums.build(album_params)
      @album.user = current_user
      if @album.save
        @media = @album.media
        privacy = @gallery.bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "galleries.create_album", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @album.id, object_type: @album.class.name, privacy: privacy, feed: true,
                        bubble_id: @gallery.bubble.id, extra_data: {name: @album.name})
        render :create, status: :created
      else
        render 'api/v1/shared/failure', locals: {errors: [@album.errors]}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["is not a member of this bubble"]}] }, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if current_user.can_manage?(@gallery.bubble)
      old_name = @album.name
      if @album.update_attributes(album_params)
        @media = @album.media
        privacy = @gallery.bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "galleries.update_album", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @album.id, object_type: @album.class.name, privacy: privacy, feed: true,
                        bubble_id: @gallery.bubble.id, extra_data: {name: @album.name, old_name: old_name})
        render :show, status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: [@album.errors]}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  def destroy
    if current_user.can_manage?(@gallery.bubble)
      @album.destroy
      privacy = @gallery.bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
      Activity.create(name: "galleries.destroy_album", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                      privacy: privacy, feed: false, bubble_id: @gallery.bubble.id, extra_data: {name: @album.name})
      render 'api/v1/shared/empty_response', status: :ok
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  private

  def find_album
    @album = @gallery.albums.find(params[:id])
  end

  def find_gallery
    @gallery = ::Widgets::GalleryWidget::Gallery.find(params[:gallery_id])
  end

  def album_params
    params.require(:album).permit(:name, :description)
  end
end