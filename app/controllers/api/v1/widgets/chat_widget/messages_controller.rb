class Api::V1::Widgets::ChatWidget::MessagesController < ApplicationController
  include ActionView::Helpers::SanitizeHelper

  before_action :find_chat, except: [:remove_attachment]
  before_action :find_bubble, except: [:remove_attachment]
  before_action :allow_only_members, except: [:remove_attachment]
  # before_action :picture_file_hot_fix, only: [:create]

  def create
    text = sanitize(params[:message], tags: %w(strong b em i del ins mark s strike u))
    @chat_message = @chat.messages.build(text: text, user_id: current_user.id, video_url: params[:video_url]) #

    if params[:picture_file].present? and params[:picture_file].is_a?(String)
      if params[:picture_file] =~ /\Adata:image\/\w+;base64,.+/
        unless @chat_message.add_picture(current_user.id, params[:picture_file], params[:picture_filename])
          render 'api/v1/shared/failure', locals: {errors: [{message: 'File is not valid'}]}, status: :unprocessable_entity
          return
        end
      elsif File.exist?("#{Rails.root}/public#{params[:picture_file]}")
        picture = ::Attachments::Picture.new
        File.open("#{Rails.root}/public#{params[:picture_file]}") do |f|
          picture.file = f
        end
        medium = @chat_message.media.build(user_id: current_user.id, attachmentable: picture)
        medium.save
      else
        render 'api/v1/shared/failure', locals: {errors: [{message: "'picture_file' contains invalid url"}]}, status: :unprocessable_entity
        return
      end
    end

    # if params[:picture_file].present? and !@chat_message.add_picture(current_user.id, params[:picture_file], params[:picture_filename])
    #   render 'api/v1/shared/failure', locals: {errors: [{message: 'File is not valid'}]}, status: :unprocessable_entity
    #   return
    # end

    has_video = false
    if params[:video_id].present?
      @media = current_user.media.find_by(id: params[:video_id])
      if @media.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: 'Video is not found'}]}, status: :not_found
        return
      else
        @chat_message.media << @media
        has_video = true
      end
    end

    if params[:link_url].present?
      link_preview_attrs = {url: params[:link_url], title: params[:link_title], description: params[:link_description], picture_url: params[:link_picture_url]}
      @chat_message.link_previews.build(link_preview_attrs)
    end

    if @chat_message.save
      @message = {}
      @message[:id] = @chat_message.id
      @message[:text] = @chat_message.text
      @message[:attachment_url] = @chat_message.picture_attachment.file_url rescue ''
      @message[:video_links] = @chat_message.video_attachment.links rescue []
      @message[:video_thumbnail] = @chat_message.video_attachment.thumbnail rescue ''
      @message[:has_video] = has_video # !!! notify message has the video
      @message[:video_url] = @chat_message.video_url || ''
      @message[:channel_name] = @bubble.permalink
      @message[:user_name] = @chat_message.user.first_name       # FIXME: user_name -> first_name
      @message[:user_profile_url] = @chat_message.user.username  # FIXME: user_profile_url -> username
      @message[:user_avatar_url] = @chat_message.user.avatar_url(:thumb)
      @message[:created_at] = @chat_message.created_at.iso8601
      link_preview = @chat_message.link_previews.first
      if link_preview.nil?
        @message[:link_preview] = ''
      else
        @message[:link_preview] = {}
        @message[:link_preview][:url] = link_preview.url
        @message[:link_preview][:title] = link_preview.title
        @message[:link_preview][:description] = link_preview.description
        @message[:link_preview][:picture_url] = link_preview.picture_url
      end
      # ActionCable.server.broadcast "bc-#{@message[:channel_name]}", message: @message

      Pusher.trigger("private-chatwidget-#{@message[:channel_name]}", 'message_created', message: @message)
    else
      render 'api/v1/shared/failure', locals: {errors: @chat_message.errors}, status: :unprocessable_entity
    end
  end

  def recent_messages
    page_number = parse_page_param
    if page_number.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'page' parameter should be present"}]}, status: :bad_request
      return
    end
    limit = Integer(params[:count]) rescue 50
    offset = page_number * limit

    @messages = @chat.messages.order(created_at: :desc).offset(offset).limit(limit).to_a.sort {|current, _next| current.created_at <=> _next.created_at } rescue []
  end

  def remove_attachment
    @chat_message = ::Widgets::ChatWidget::Message.find_by(id: params[:id])
    if @chat_message.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "Message not found"}]}, status: :not_found
    else
      if current_user != @chat_message.user
        render 'api/v1/shared/failure', locals: { errors: [{ message: 'access denied' }] }, status: :unauthorized
        return
      end
      if @chat_message.media.present? and @chat_message.created_at > Time.now - 24.hours
        @chat_message.media.destroy_all
      end
      if @chat_message.text.blank? and @chat_message.video_url.blank? and @chat_message.media.blank?
        @chat_message.destroy
      end

      @messages = @chat_message.chat.messages.order(created_at: :desc).  # .where("chat_widget_messages.created_at > ?", DateTime.yesterday)
          limit(30).to_a.sort {|current, _next| current.created_at <=> _next.created_at }    # limit 30 - default count
      render :recent_messages, status: :ok
    end
  end

  private

  def find_chat
    @chat = ::Widgets::ChatWidget::Chat.find_by(id: params[:chat_id])
    if @chat.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "Chat not found"}]}, status: :not_found
    end
  end
  
  def find_bubble
    @bubble = @chat.widget.bubble rescue nil
    if @bubble.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "Bubble not found"}]}, status: :not_found
    end
  end

  def allow_only_members
    if BubbleMember.where(user_id: current_user.id, bubble_id: @bubble.id).first.nil?
      render 'api/v1/shared/failure', locals: { errors: [{ message: 'access denied' }] }, status: :unauthorized
      return
    end
  end

  def picture_file_hot_fix
    if params[:picture_file].present? and params[:picture_file] =~ /\Ahttps?:\/\//
      params[:picture_file] = nil
    end
  end
end
