class Api::V1::NotesController < ApplicationController
  include ActionView::Helpers::SanitizeHelper
  before_action :find_note, except: [:index, :create]
  # before_action :picture_file_hot_fix, only: [:create]

  def index
    page_number = parse_page_param
    limit = Integer(params[:count]) rescue 16
    offset = page_number * limit
    @notes = current_user.notes.order(created_at: :desc).offset(offset).limit(limit)

    @notes.each do |note|
      note.visits.create(user: current_user)
    end
  end

  def show
    @note.visits.create(user: current_user)
  end

  def create
    text = sanitize(params[:text], tags: %w(strong b em i del ins mark s strike u))
    @note = current_user.notes.build(text: text, private: params[:private])

    if params[:picture_file].present? and params[:picture_file].is_a?(String)
      if params[:picture_file] =~ /\Adata:image\/\w+;base64,.+/
        unless @note.add_picture(current_user.id, params[:picture_file], params[:picture_filename])
          render 'api/v1/shared/failure', locals: {errors: [{message: 'File is not valid'}]}, status: :unprocessable_entity
          return
        end
      elsif File.exist?("#{Rails.root}/public#{params[:picture_file]}")
        picture = ::Attachments::Picture.new
        File.open("#{Rails.root}/public#{params[:picture_file]}") do |f|
          picture.file = f
        end
        medium = @note.media.build(user_id: current_user.id, attachmentable: picture)
        medium.save
      else
        render 'api/v1/shared/failure', locals: {errors: [{message: "'picture_file' contains invalid url"}]}, status: :unprocessable_entity
        return
      end
    end

    # if params[:picture_file].present? and !@note.add_picture(current_user.id, params[:picture_file], params[:picture_filename])
    #   render 'api/v1/shared/failure', locals: {errors: [{message: 'File is not valid'}]}, status: :unprocessable_entity
    #   return
    # end

    if params[:video_id].present?
      @media = current_user.media.find_by(id: params[:video_id])
      if @media.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: 'Video is not found'}]}, status: :not_found
        return
      else
        @note.media << @media
      end
    end

    if params[:link_url].present?
      link_preview_attrs = {url: params[:link_url], title: params[:link_title], description: params[:link_description], picture_url: params[:link_picture_url]}
      @note.link_previews.build(link_preview_attrs)
    end

    if @note.save
      render :show, locals: {trim: true}
    else
      render 'api/v1/shared/failure', locals: {errors: @note.errors}, status: :unprocessable_entity
    end
  end

  def destroy
    if @note.user == current_user
      @note.destroy
      Activity.where(object_type: 'Note', object_id: @note.id, feed: true).update_all(feed: false) if @note.destroyed?
      @notes = current_user.notes.order(created_at: :desc).limit(16)
      render :index
    else
      render 'api/v1/shared/failure', locals: {errors: [message: 'Access denied']}, status: :unauthorized
    end
  end

  def like
    if current_user.like! @note
      @note.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @note.class.name, object_id: @note.id,
      #                                                  likes_count: @note.likers_count, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'note_likes_count_changed', {message: {object_type: @note.class.name, object_id: @note.id, likes_count: @note.likers_count, username: current_user.username }})

      if current_user != @note.user
        Notification.create(user_id: @note.user.id, initiator_type: 'User', initiator_id: current_user.id,
                            name: "note:liked", text: "Your note was liked",extra_data: { note_id: @note.id })
      end
    end
  end

  def unlike
    if current_user.unlike! @note
      @note.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @note.class.name, object_id: @note.id,
      #                                                  likes_count: @note.likers_count, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'note_likes_count_changed', {message: {object_type: @note.class.name, object_id: @note.id, likes_count: @note.likers_count, username: current_user.username }})
    end
    render :like, status: :ok
  end

  def add_comment
    text = sanitize(params[:message], tags: %w(strong b em i del ins mark s strike u))
    @comment = Comment.build_from(@note, current_user.id, text)
    @comment.save!
    if params[:parent_id].blank?
      Notification.create(user_id: @note.user.id, initiator_type: 'User', initiator_id: current_user.id,
                          name: "note:commented", text: "Your note was commented",extra_data: { note_id: @note.id }) if @note.user != current_user
    else
      @comment.move_to_child_of(Comment.find_by(id: params[:parent_id]))
      @comment.update(parent_id: params[:parent_id])
    end
    @note.reload
    # ActionCable.server.broadcast 'global', message: { object_type: @note.class.name, object_id: @note.id,
    #                                                   comments_count: @note.comment_threads.count,
    #                                                   location: params[:location],
    #                                                   profile_url: current_user.username } # FIXME: profile_url -> username

    Pusher.trigger('global', 'note_comments_count_changed', {message: {object_type: @note.class.name, object_id: @note.id,
                                                         comments_count: @note.comment_threads.count,
                                                         location: params[:location],
                                                         username: current_user.username }})
    render 'api/v1/shared/empty_response'
  end

  def rate
    if params[:rating].to_i == 0
      old_rating = @note.ratings.where(user_id: current_user.id).first
      unless old_rating.nil?
        old_rating.destroy
        if old_rating.destroyed?
          @note.reload
          rating, raters_count = @note.rating_info
          # ActionCable.server.broadcast 'global', message: {object_type: @note.class.name, object_id: @note.id, raters_count: raters_count,
          #                                                  rating: rating, profile_url: current_user.username } # FIXME: profile_url -> username

          Pusher.trigger('global', 'note_rating_changed', {message: {object_type: @note.class.name, object_id: @note.id,
                                                                raters_count: raters_count, rating: rating, username: current_user.username }})
        end
      end
    elsif current_user.set_rating_for @note, params[:rating]
      @note.reload
      rating, raters_count = @note.rating_info
      # ActionCable.server.broadcast 'global', message: {object_type: @note.class.name, object_id: @note.id, raters_count: raters_count,
      #                                                  rating: rating, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'note_rating_changed', {message: {object_type: @note.class.name, object_id: @note.id,
                                                            raters_count: raters_count, rating: rating, username: current_user.username }})
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Some error occurred'}]}, status: :unprocessable_entity
      return
    end
    render 'api/v1/shared/empty_response'
  end

  private

  def find_note
    @note = Note.find_by(id: params[:id])
    render 'api/v1/shared/failure', locals: {errors: [{message: "Record not found"}]}, status: :not_found if @note.nil?
  end

  def picture_file_hot_fix
    if params[:picture_file].present? and params[:picture_file] =~ /\Ahttps?:\/\//
      params[:picture_file] = nil
    end
  end

end
