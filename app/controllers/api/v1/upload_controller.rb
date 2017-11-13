class Api::V1::UploadController < ApplicationController
  include ActionView::Helpers::SanitizeHelper

  def create
    if current_user.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'unauthorized user'}]}, status: :unprocessable_entity and return
    end

    bubble = Bubble.find_by(id: params[:bubble_id])
    if bubble.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'bubble not found'}]}, status: :unprocessable_entity and return
    end

    @file = UploadedFile.new(file: params[:file])
    @file.bubble_id = params[:bubble_id]
    @file.owner_id = current_user.id
    @file.url = ''
    @file.downloads = 0
    @file.created_at = DateTime.now

    if @file.save
      @file.url = @file.file_url
      @file.save
      @status = true
      @url = @file.url
      notify(bubble, @file)
      render :create
    else
      render 'api/v1/shared/failure', locals: {errors: [@file.errors]}, status: :unprocessable_entity
    end
  end

  def file_params
    params.permit(:file, :content_type, :file_name)
  end

  def notify(bubble, file)
    ws_msg = {
      adapter: 'pusher',
      channel: "private-bubble-#{bubble.permalink}",
      event: 'file_uploaded',
      data: {
        id: file.id,
        owner_id: file.owner_id,
        bubble_id: file.bubble_id,
        url: file.url,
        filename: file.file_identifier,
        content_type: file.content_type,
        downloads: file.downloads,
        created_at: file.created_at.to_s,
        uploader: {
          id: current_user.id,
          username: current_user.username,
          avatar_url: current_user.avatar_url,
        },
        bubble: {
          id: bubble.id,
          permalink: bubble.permalink,
          name: bubble.name,
          avatar_url: bubble.avatar_url,
        }
      },
      debug_info: {
        location: 'Api::V1::UploadController#notify',
        user_id: current_user.id,
        channel: "private-bubble-#{bubble.permalink}",
        event: 'file_uploaded',
        id: file.id,
        owner_id: file.owner_id,
        bubble_id: file.bubble_id
      }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
