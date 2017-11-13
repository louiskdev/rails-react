class Api::V1::MediaController < ApplicationController
  include ActionView::Helpers::SanitizeHelper
  before_action :find_media, only: [:show, :update, :destroy, :put, :like, :unlike, :add_comment]

  before_action :check_gallery, only: [:upload_pictures, :upload_videos]
  before_action :check_album,   only: [:upload_pictures, :upload_videos]

  def create
    @media = current_user.media.build(media_params)
    @media.album_id = params[:album_id].to_i if params[:album_id].present? && Album.find_by(id: params[:album_id].to_i).present?

    if params[:bubble_id].present?
      bubble = Bubble.find_by(id: params[:bubble_id])
      if bubble.nil? or bubble.gallery_widget.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: 'bubble or gallery is not found'}]}, status: :unprocessable_entity and return
      else
        @media.mediable = bubble.gallery_widget
      end
    end

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

      bubble = nil
      if @media.try(:mediable).try(:bubble).present?
        activity_name = 'galleries.create_media'
        bubble = @media.mediable.bubble
        privacy = bubble.privy? ? Activity.privacies[:p_friends] : Activity.privacies[:p_public]
        extra_data.merge!(bubble: {name: bubble.name})
      elsif @media.album_id.present?
        activity_name = 'albums.create_media'
        privacy = Activity.privacies[:p_private]
      else
        activity_name = 'media.create'
        privacy = Activity.privacies[:p_private]
      end

      if @media.album.present?
        extra_data.merge!(album: {name: @media.album.name, id: @media.album.id})
      end

      Activity.create(name: activity_name, user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                      object_id: @media.id, object_type: @media.class.name, privacy: privacy, feed: true,
                      bubble_id: bubble.try(:id), extra_data: extra_data)

      if @media.album_id.present?
        @collection = Album.find(@media.album_id).media.available_in_user_gallery.newest.limit(Medium::ITEMS_PER_PAGE)
        @media_count = Album.find(@media.album_id).media.available_in_user_gallery.count
      else
        @collection = current_user.media.where(album_id: nil).available_in_user_gallery.newest.limit(Medium::ITEMS_PER_PAGE)
        @media_count = current_user.media.where(album_id: nil).available_in_user_gallery.count
      end

      render :create, status: :created
    else
      render 'api/v1/shared/failure', locals: {errors: [@media.errors]}, status: :unprocessable_entity
    end
  end

  def show
    @media.visits.create(user: current_user)
  end

  def update
    if current_user == @media.uploader
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
        Activity.create(name: "media.update", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @media.id, object_type: @media.class.name, privacy: Activity.privacies[:p_private],
                        feed: true, extra_data: {title: @media.title, old_title: old_title})
        render :show, status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: [@media.errors]}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{user: ["hasn't access"]}] }, status: :unauthorized
    end
  end

  def destroy
    unless @media.uploader == current_user
      bubble = @media.gallery.try(:bubble)
      if bubble.nil? or !current_user.can_manage?(bubble)
        render 'api/v1/shared/failure', locals: {errors: [{message: ["User hasn't access"]}] }, status: :unauthorized
        return
      end
    end

    @media.destroy
    if @media.destroyed?
      extra_data = {title: @media.title, type: @media.type}

      bubble = nil
      if @media.try(:mediable).try(:bubble).present?
        activity_name = 'galleries.destroy_media'
        bubble = @media.mediable.bubble
        privacy = bubble.privy? ? Activity.privacies[:p_friends] : Activity.privacies[:p_public]
        extra_data.merge!(bubble: {name: bubble.name})
      elsif @media.album_id.present?
        activity_name = 'albums.destroy_media'
        privacy = Activity.privacies[:p_private]
      else
        activity_name = 'media.destroy'
        privacy = Activity.privacies[:p_private]
      end

      Activity.create(name: activity_name, user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                      privacy: privacy, feed: false, bubble_id: bubble.try(:id), extra_data: extra_data)
    end
    render 'api/v1/shared/empty_response', status: :ok
  end

  def put
    if params[:album_id].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "Parameter 'album_id' is required"}] }, status: :bad_request
    else
      @album = Album.find_by(id: params[:album_id])
      if @album.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: ["Album is not found"]}] }, status: :not_found
      else
        bubble = @media.gallery.try(:bubble)
        if @media.uploader == current_user || bubble.present? && current_user.is_member_of?(bubble)
          old_album = @media.album
          @media.album = @album
          if params[:gallery_id].present?
            gallery = Widgets::GalleryWidget::Gallery.find_by(id: params[:gallery_id].to_i)
            @media.mediable = gallery unless gallery.nil?
          end
          if @media.save
            extra_data = {title: @media.title, album: {name: @album.name, id: @album.id, old_name: old_album.try(:name), old_id: old_album.try(:id)}}
            bubble = nil
            if @media.try(:mediable).try(:bubble).present?
              bubble = @media.mediable.bubble
              privacy = bubble.privy? ? Activity.privacies[:p_friends] : Activity.privacies[:p_public]
              extra_data.merge!(bubble: {name: bubble.name})
            else
              privacy = Activity.privacies[:p_private]
            end

            Activity.create(name: 'media.put_media', user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                            object_id: @media.id, object_type: @media.class.name, privacy: privacy, feed: true,
                            bubble_id: bubble.try(:id), extra_data: extra_data)
          end
        else
          render 'api/v1/shared/failure', locals: {errors: [{message: ["User hasn't access"]}] }, status: :unauthorized
        end
      end
    end
  end

  def upload_video
    if params[:video_file].present?
      attachment = ::Attachments::Video.new(file: params[:video_file], source_area: params[:source_area])
      @media = current_user.media.build(attachmentable: attachment)
      # attachment.medium = @media  #notify attachment object about associated medium object (VideoUploader needs it)
      if @media.save
        @job_id = attachment.recoding_job_key
        render :upload_video, status: :ok
      else
        render 'api/v1/shared/failure', locals: {errors: [@media.errors]}, status: :unprocessable_entity
      end
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: "Parameter 'video_file' is required"}] }, status: :bad_request
    end
  end

  def upload_videos
    upload_media(:video)
  end

  def upload_pictures
    upload_media(:picture)
  end

  def like
    if current_user.like! @media
      @media.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @media.class.name, object_id: @media.id,
      #                                                  likes_count: @media.likers_count, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'media_likes_count_changed', {message: {object_type: @media.class.name, object_id: @media.id, likes_count: @media.likers_count, username: current_user.username }})

      if current_user != @media.uploader
        Notification.create(user_id: @media.uploader.id, initiator_type: 'User', initiator_id: current_user.id,
                            name: "media:liked", text: "Your media was liked",extra_data: { media_id: @media.id })
      end
    end
  end

  def unlike
    if current_user.unlike! @media
      @media.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @media.class.name, object_id: @media.id,
      #                                                  likes_count: @media.likers_count, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'media_likes_count_changed', {message: {object_type: @media.class.name, object_id: @media.id, likes_count: @media.likers_count, username: current_user.username }})
    end
    render :like, status: :ok
  end

  def add_comment
    text = sanitize(params[:message], tags: %w(strong b em i del ins mark s strike u))
    @comment = Comment.build_from(@media, current_user.id, text)
    @comment.save!
    if params[:parent_id].blank?
      Notification.create(user_id: @media.uploader.id, initiator_type: 'User', initiator_id: current_user.id,
                          name: "media:commented", text: "Your media was commented",extra_data: { media_id: @media.id }) if @media.uploader != current_user
    else
      @comment.move_to_child_of(Comment.find_by(id: params[:parent_id]))
      @comment.update(parent_id: params[:parent_id])
    end
    @media.reload
    # ActionCable.server.broadcast 'global', message: { object_type: @media.class.name, object_id: @media.id,
    #                                                   comments_count: @media.comment_threads.count,
    #                                                   location: params[:location],
    #                                                   profile_url: current_user.username } # FIXME: profile_url -> username

    Pusher.trigger('global', 'media_comments_count_changed', {message: {object_type: @media.class.name, object_id: @media.id,
                                                                  comments_count: @media.comment_threads.count,
                                                                  location: params[:location],
                                                                  username: current_user.username }})

    render 'api/v1/shared/empty_response'
  end

  private

  def upload_media(type)
    failed = false
    current_date = Time.now

    params.each do |key, value|
      if value.class.name == 'ActionDispatch::Http::UploadedFile'
        attachment = "::Attachments::#{type.to_s.camelcase}".constantize.new(file: value)
        media = current_user.media.build(attachmentable: attachment, title: key, created_at: current_date)
        media.album = @album unless @album.nil?
        media.mediable = @gallery unless @gallery.nil?
        media.skip_creation_callbacks!
        unless media.save
          @media = media
          failed = true
          next
        end
      end
    end

    media_set = Medium.where(created_at: current_date, user_id: current_user.id, album_id: @album.try(:id))
    media_count = media_set.count

    notify! if media_count > 0

    if media_count == 1
      media_set.first.force_activity_creating!
    elsif media_count > 1 # `all images in 1 activity` feature
      extra_data = {media_count: media_count, media_ids: media_set.ids}
      bubble = @gallery.try(:bubble)
      if bubble.present?
        activity_name = 'galleries.create_media'
        privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        extra_data.merge!(bubble: {name: bubble.name})
      elsif @album.present?
        activity_name = 'albums.create_media'
        privacy = Activity.privacies[:p_private]
      else
        activity_name = 'media.create'
        privacy = Activity.privacies[:p_private]
      end

      if @album.present?
        extra_data.merge!(album: {name: @album.name, id: @album.id})
      end

      Activity.create(name: activity_name, user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                      object_id: @album.id, object_type: @album.class.name, privacy: privacy, feed: true,
                      bubble_id: bubble.try(:id), extra_data: extra_data)
    end

    if failed
      render 'api/v1/shared/failure', locals: {errors: [@media.errors]}, status: :ok
    else
      render json: {message: 'OK'}, status: :ok
    end
  end

  def check_gallery
    if params[:gallery_id].present?
      @gallery = ::Widgets::GalleryWidget::Gallery.find_by(id: params[:gallery_id])
      if @gallery.nil?
        render('api/v1/shared/failure', locals: {errors: [{message: 'Gallery not found'}]}, status: :ok) and return
      elsif !current_user.is_member_of?(@gallery.bubble)
        render('api/v1/shared/failure', locals: {errors: [{message: 'Access denied'}]}, status: :ok) and return
      end
    end
  end

  def check_album
    if params[:album_id].present?
      @album = @gallery.nil? ? current_user.albums.where(gallery_id: nil, id: params[:album_id]).first : @gallery.albums.find_by(id: params[:album_id])
      if @album.nil?
        render('api/v1/shared/failure', locals: {errors: [{message: 'Album not found'}]}, status: :ok) and return
      end
    end
  end


  def media_params
    params.require(:medium).permit(:title)
  end

  def find_media
    @media = Medium.find_by(id: params[:id], mediable_type: ['Widgets::GalleryWidget::Gallery', nil])
    render 'api/v1/shared/failure', locals: {errors: [{message: ["Picture or video is not found"]}] }, status: :not_found if @media.nil?
  end

  def notify!
    if @album.present?
      if @gallery.nil?
        channel = "profile-page-#{current_user.id}"
        bubble_data = {}
      else
        bubble = @gallery.bubble
        channel = "private-bubble-#{bubble.permalink}"
        bubble_data = { id: bubble.id, permalink: bubble.permalink }
      end

      ws_msg = {
          adapter: 'pusher',
          channel: channel,
          event: 'album_media_count_changed',
          data: {
              album: {
                  id: @album.id,
                  media_count: @album.media.count
              },
              bubble: bubble_data
          },
          debug_info: {
              location: 'Api::V1::MediaController#notify!',
              user_id: current_user.id,
              channel: channel,
              event: 'album_media_count_changed'
          }
      }
      RealTimeNotificationJob.perform_later(ws_msg)
    end
  end

end
