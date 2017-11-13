class Api::V1::CommentsController < ApplicationController
  before_action :check_request_params, only: [:index]
  before_action :find_commentable_object, only: [:index]
  before_action :find_comment, only: [:like, :unlike]

  def index
    @root_comments = @commentable.root_comments.order(:created_at)
    @total_comments_count = @commentable.comment_threads.count
  end

  def like
    if current_user.like! @comment
      @comment.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @comment.class.name, object_id: @comment.id,
      #                                                  likes_count: @comment.likers_count, profile_url: current_user.username } # FIXME: profile_url -> username

      Pusher.trigger('global', 'comment_likes_count_changed', {message: {object_type: @comment.class.name, object_id: @comment.id, likes_count: @comment.likers_count, username: current_user.username }})

      if current_user != @comment.user
        Notification.create(user_id: @comment.user.id, initiator_type: 'User', initiator_id: current_user.id,
                            name: "comment:liked", text: "Your comment was liked",extra_data: { comment_id: @comment.id })
      end
    end
  end

  def unlike
    if current_user.unlike! @comment
      @comment.reload
      # ActionCable.server.broadcast 'global', message: {object_type: @comment.class.name, object_id: @comment.id,
      #                                                  likes_count: @comment.likers_count, profile_url: current_user.username }  # FIXME: profile_url -> username

      Pusher.trigger('global', 'comment_likes_count_changed', {message: {object_type: @comment.class.name, object_id: @comment.id, likes_count: @comment.likers_count, username: current_user.username }})

    end
    render :like, status: :ok
  end

  private

  def check_request_params
    if params[:commentable_type].blank? or params[:commentable_id].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'commentable_type' and 'commentable_id' parameters are required"}]}, status: :bad_request
    end
  end

  def find_commentable_object
    @commentable = case params[:commentable_type]
                     when 'media' then Medium.find_by(id: params[:commentable_id])
                     when 'note'  then Note.find_by(id: params[:commentable_id])
                     when 'post'  then Widgets::BlogWidget::Post.find_by(id: params[:commentable_id])
                     else
                       'unknown'
                   end
    if @commentable.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Commentable object not found'}]}, status: :not_found
    elsif @commentable.kind_of?(String) and @commentable == 'unknown'
      render 'api/v1/shared/failure', locals: {errors: [{message: "Unknown 'commentable_type' parameter"}]}, status: :bad_request
    end
  end

  def find_comment
    @comment = Comment.find_by(id: params[:id])
    render 'api/v1/shared/failure', locals: {errors: [{message: "Record not found"}]}, status: :not_found if @comment.nil?
  end
end
