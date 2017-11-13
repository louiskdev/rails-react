class Api::V1::Widgets::BlogWidget::PostsController < ApplicationController
  include ActionView::Helpers::SanitizeHelper
  before_action :find_blog
  before_action :find_post, except: :create
  # before_action :picture_file_hot_fix, only: [:create]

  def create
    bubble = @blog.bubble
    bm = current_user.bubble_members.where(bubble_id: bubble.id).first
    if bubble.nil? or bm.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'You are not a member of this bubble'}]}, status: :unauthorized
    else
      text = sanitize(params[:text], tags: %w(strong b em i del ins mark s strike u))
      @post = @blog.posts.build(text: text, user_id: current_user.id, title: params[:title])

      if params[:picture_file].present? and params[:picture_file].is_a?(String)
        if params[:picture_file] =~ /\Adata:image\/\w+;base64,.+/
          unless @post.add_picture(current_user.id, params[:picture_file], params[:picture_filename])
            render 'api/v1/shared/failure', locals: {errors: [{message: 'File is not valid'}]}, status: :unprocessable_entity
            return
          end
        elsif File.exist?("#{Rails.root}/public#{params[:picture_file]}")
          picture = ::Attachments::Picture.new
          File.open("#{Rails.root}/public#{params[:picture_file]}") do |f|
            picture.file = f
          end
          medium = @post.media.build(user_id: current_user.id, attachmentable: picture)
          medium.save
        else
          render 'api/v1/shared/failure', locals: {errors: [{message: "'picture_file' contains invalid url"}]}, status: :unprocessable_entity
          return
        end
      end

      # if params[:picture_file].present? and !@post.add_picture(current_user.id, params[:picture_file], params[:picture_filename])
      #   render 'api/v1/shared/failure', locals: {errors: [{message: 'File is not valid'}]}, status: :unprocessable_entity
      #   return
      # end

      if params[:video_id].present?
        @media = current_user.media.find_by(id: params[:video_id])
        if @media.nil?
          render 'api/v1/shared/failure', locals: {errors: [{message: 'Video is not found'}]}, status: :not_found
          return
        else
          @post.media << @media
        end
      end

      if params[:link_url].present?
        link_preview_attrs = {url: params[:link_url], title: params[:link_title], description: params[:link_description], picture_url: params[:link_picture_url]}
        @post.link_previews.build(link_preview_attrs)
      end

      if @post.save
        privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "blogs.create_post", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @post.id, object_type: @post.class.name, privacy: privacy, feed: true,
                        bubble_id: bubble.id)
      else
        render 'api/v1/shared/failure', locals: {errors: [@post.errors]}, status: :unprocessable_entity
      end
    end
  end

  def show
    @post.visits.create(user: current_user)
  end

  def update
    bubble = @blog.bubble
    bm = current_user.bubble_members.where(bubble_id: bubble.id).first
    if bubble.nil? or bm.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'You are not a member of this bubble'}]}, status: :unauthorized
    elsif bubble.privy? and bm.guest?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'You can\'t manage this bubble'}]}, status: :unauthorized
    else
      if @post.update_attributes(text: params[:text], title: params[:title])
        privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "blogs.update_post", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        object_id: @post.id, object_type: @post.class.name, privacy: privacy, feed: true,
                        bubble_id: bubble.id)
        render :show
      else
        render 'api/v1/shared/failure', locals: {errors: [@post.errors]}, status: :unprocessable_entity
      end
    end
  end

  def destroy
    bubble = @blog.bubble
    bm = current_user.bubble_members.where(bubble_id: bubble.id).first
    if bubble.nil? or bm.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'You are not a member of this bubble'}]}, status: :unauthorized
    elsif bubble.privy? and bm.guest?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'You can\'t manage this bubble'}]}, status: :unauthorized
    else
      @post.destroy
      if @post.destroyed?
        privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
        Activity.create(name: "blogs.destroy_post", user_id: current_user.id, user_ip: current_user.current_sign_in_ip,
                        privacy: privacy, feed: false, bubble_id: bubble.id, extra_data: {title: @post.title})
        Activity.where(object_type: 'Widgets::BlogWidget::Post', object_id: @post.id, feed: true).update_all(feed: false)
      end
      render 'api/v1/shared/empty_response'
    end
  end

  def like
    if current_user.like! @post
      @post.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @post.class.name, object_id: @post.id,
      #                                                  likes_count: @post.likers_count, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'post_likes_count_changed', {message: {object_type: @post.class.name, object_id: @post.id, likes_count: @post.likers_count, username: current_user.username }})

      if current_user != @post.user
        Notification.create(user_id: @post.user.id, initiator_type: 'User', initiator_id: current_user.id,
                            name: "post:liked", text: "Your post was liked",extra_data: { post_id: @post.id })
      end
    end
  end

  def unlike
    if current_user.unlike! @post
      @post.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @post.class.name, object_id: @post.id,
      #                                                  likes_count: @post.likers_count, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'post_likes_count_changed', {message: {object_type: @post.class.name, object_id: @post.id, likes_count: @post.likers_count, username: current_user.username }})
    end
    render :like, status: :ok
  end

  def add_comment
    text = sanitize(params[:message], tags: %w(strong b em i del ins mark s strike u))
    @comment = Comment.build_from(@post, current_user.id, text)
    @comment.save!
    if params[:parent_id].blank?
      Notification.create(user_id: @post.user.id, initiator_type: 'User', initiator_id: current_user.id,
                          name: "post:commented", text: "Your post was commented",extra_data: { post_id: @post.id }) if @post.user != current_user
    else
      @comment.move_to_child_of(Comment.find_by(id: params[:parent_id]))
      @comment.update(parent_id: params[:parent_id])
    end
    @post.reload
    # ActionCable.server.broadcast 'global', message: { object_type: @post.class.name, object_id: @post.id,
    #                                                   comments_count: @post.comment_threads.count,
    #                                                   location: params[:location],
    #                                                   profile_url: current_user.username } # FIXME: profile_url -> username

    Pusher.trigger('global', 'post_comments_count_changed', {message: {object_type: @post.class.name, object_id: @post.id,
                                                                  comments_count: @post.comment_threads.count,
                                                                  location: params[:location],
                                                                  username: current_user.username }})
    render 'api/v1/shared/empty_response'
  end

  def rate
    if params[:rating].to_i == 0
      old_rating = @post.ratings.where(user_id: current_user.id).first
      unless old_rating.nil?
        old_rating.destroy
        if old_rating.destroyed?
          @post.reload
          rating, raters_count = @post.rating_info
          # ActionCable.server.broadcast 'global', message: {object_type: @post.class.name, object_id: @post.id, raters_count: raters_count,
          #                                                  rating: rating, profile_url: current_user.username } # FIXME: profile_url -> username

          Pusher.trigger('global', 'post_rating_changed', {message: {object_type: @post.class.name, object_id: @post.id,
                                                                raters_count: raters_count, rating: rating, username: current_user.username }})
        end
      end
    elsif current_user.set_rating_for @post, params[:rating]
      @post.reload
      rating, raters_count = @post.rating_info
      # ActionCable.server.broadcast 'global', message: {object_type: @post.class.name, object_id: @post.id, raters_count: raters_count,
      #                                                  rating: rating, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'post_rating_changed', {message: {object_type: @post.class.name, object_id: @post.id,
                                                            raters_count: raters_count, rating: rating, username: current_user.username }})
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Some error occurred'}]}, status: :unprocessable_entity
      return
    end
    render 'api/v1/shared/empty_response'
  end

  private

  def find_blog
    @blog = ::Widgets::BlogWidget::Blog.find(params[:blog_id])
  end

  def find_post
    @post = @blog.posts.find(params[:id])
  end

  def picture_file_hot_fix
    if params[:picture_file].present? and params[:picture_file] =~ /\Ahttps?:\/\//
      params[:picture_file] = nil
    end
  end
end
