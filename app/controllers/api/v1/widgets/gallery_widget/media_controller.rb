class Api::V1::Widgets::GalleryWidget::MediaController < ApplicationController
  before_action :find_gallery, only: [:create, :show, :update, :destroy]
  before_action :find_media, only: [:update, :show, :destroy]

  def create
    bubble = @gallery.bubble
    bm = current_user.bubble_members.where(bubble_id: bubble.id).first
    if bubble.nil? or bm.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'You are not a member of this bubble'}]}, status: :unauthorized
    else
      @media = Medium.new(mediable: @gallery, user_id: current_user.id, title: params[:title])
      @media.album_id = params[:album_id].to_i if params[:album_id].present? && Album.find_by(id: params[:album_id].to_i).present?

      if params[:picture_file].present?
        attachment = ::Attachments::Picture.new
        unless attachment.add_encoded_attachment(params[:picture_file], params[:filename])
          render 'api/v1/shared/failure', locals: {errors: [{attachment: 'is not valid'}]}, status: :unprocessable_entity and return
        end
      elsif params[:video_file].present?
        attachment = ::Attachments::Video.new(file: params[:video_file])
      end
      @media.attachmentable = attachment

      if @media.save
        extra_data = {title: @media.title}

        if @media.album_id.present?
          @collection = Album.find(@media.album_id).media.limit(Medium::ITEMS_PER_PAGE)
          @media_count = Album.find(@media.album_id).media.count
          extra_data.merge!(album: {name: @media.album.name, id: @media.album.id})
        else
          @collection = @gallery.media.where(album_id: nil).limit(Medium::ITEMS_PER_PAGE)
          @media_count = @gallery.media.where(album_id: nil).count
        end

        privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "galleries.create_media", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @media.id, object_type: @media.class.name, privacy: privacy, feed: true,
                        bubble_id: bubble.id, extra_data: extra_data)
        render :create, status: :created
      else
        render 'api/v1/shared/failure', locals: {errors: [@media.errors]}, status: :unprocessable_entity
      end
    end

  end

  def show
    @media.visits.create(user: current_user)
  end

  def update
    if current_user == @media.uploader or current_user.can_manage?(@gallery.bubble)
      if params[:picture_file].present?
        picture = ::Attachments::Picture.new
        if picture.add_encoded_attachment(params[:picture_file], params[:filename])
          if picture.save
            @media.attachmentable = picture
            @media.save
          else
            render 'api/v1/shared/failure', locals: {errors: [picture.errors]}, status: :unprocessable_entity
            return
          end
        else
          render 'api/v1/shared/failure', locals: {errors: [{picture: 'is invalid'}]}, status: :unprocessable_entity
          return
        end
      end
      old_title = @media.title
      if @media.update_attributes(media_params)
        privacy = @gallery.bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "galleries.update_media", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @media.id, object_type: @media.class.name, privacy: privacy, feed: true,
                        bubble_id: @gallery.bubble.id, extra_data: {title: @media.title, old_title: old_title})
        render :show, status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: [@media.errors]}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  def destroy
    if current_user == @media.uploader or current_user.can_manage?(@media.bubble)
      @media.destroy
      if @media.destroyed?
        privacy = @media.bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "galleries.destroy_media", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        privacy: privacy, feed: false, extra_data: {title: @media.title, type: @media.type},
                        bubble_id: @media.bubble.id)
      end
      if @media.album_id.present?
        @collection = Album.find(@media.album_id).media.limit(Medium::ITEMS_PER_PAGE)
        @media_count = Album.find(@media.album_id).media.count
      else
        @collection = @gallery.media.where(album_id: nil).limit(Medium::ITEMS_PER_PAGE)
        @media_count = @gallery.media.where(album_id: nil).count
      end
      render :destroy, status: :ok
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  private

  def media_params
    params.require(:medium).permit(:title)
  end

  def find_gallery
    @gallery = ::Widgets::GalleryWidget::Gallery.find(params[:gallery_id])
  end

  def find_media
    @media = @gallery.media.find(params[:id])
  end
end