class Api::V1::WheelChat::ChatsController < ApplicationController
  include ActionView::Helpers::SanitizeHelper

  before_action :check_channel_name, except: [:friends_online, :friends_filter, :remove_attachment]  #, :upload_video
  before_action :find_chat, only: [:update, :destroy, :clear_notifications]
  before_action :find_or_create_chat, only: :send_message

  def update
    @chat.update(mute: params[:mute])
  end

  def destroy
    if @chat.present?
      @chat.destroy
    end
    render 'api/v1/shared/empty_response', status: :ok
  end

  def recent_messages
    page_number = parse_page_param
    if page_number.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'page' parameter should be present"}]}, status: :bad_request
      return
    end
    limit = Integer(params[:count]) rescue 50
    offset = page_number * limit

    @chat = ::WheelChat::Chat.find_or_initialize_by(channel_name: params[:channel_name])
    @messages = @chat.messages.order(created_at: :desc).offset(offset).limit(limit).to_a.sort {|current, _next| current.created_at <=> _next.created_at } rescue []
  end

  def send_message
    text = sanitize(params[:message], tags: %w(strong b em i del ins mark s strike u))
    @chat_message = @chat.messages.build(text: text, user_id: current_user.id, video_url: params[:video_url])

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

    if params[:video_id].present?
      @media = current_user.media.find_by(id: params[:video_id])
      if @media.nil?
        render 'api/v1/shared/failure', locals: {errors: [{message: 'Video is not found'}]}, status: :not_found
        return
      else
        @chat_message.media << @media
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
      @message[:channel_name] = @chat.channel_name
      @message[:user_name] = @chat_message.user.first_name       # FIXME: user_name -> first_name
      @message[:user_profile_url] = @chat_message.user.username  # FIXME: user_profile_url -> username
      @message[:user_avatar_url] = @chat_message.user.avatar_url(:thumb)
      @message[:created_at] = @chat_message.created_at.iso8601
      @message[:private] = true
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

      # BubbleChatRelayJob.perform_later(@message)
      receiver_id = @chat.user_ids.reject { |el| el == @chat_message.user.id }.first
      ::WheelChat::Notification.create(initiator_id: @chat_message.user.id, user_id: receiver_id, channel_name: @chat.channel_name)
    else
      render 'api/v1/shared/failure', locals: {errors: @chat_message.errors}, status: :unprocessable_entity
    end
  end

  def friends_online
    @friends_online = current_user.friends.where('users.last_ping_date > ?', DateTime.now - User::ONLINE_TIME_INTERVAL_IN_MINUTES.minutes).limit(5)
  end

  def friends_filter
    limit = Integer(params[:count]) rescue 5
    offset = Integer(params[:offset]) rescue 0
    @friends = current_user.friends.where("users.username ILIKE :text OR users.first_name ILIKE :text", text: "%#{params[:text]}%").
        offset(offset).limit(limit) rescue []
  end

  def clear_notifications
    if @chat.present?
      ::WheelChat::Notification.where(channel_name: @chat.channel_name).destroy_all
      # ActionCable.server.broadcast @chat.channel_name, message: {notifications: []}

      Pusher.trigger("private-messages_#{@chat.channel_name}", 'notifications_removed', message: {notifications: []})
    end
    render 'api/v1/shared/empty_response', status: :ok
  end

  def remove_attachment
    @chat_message = ::WheelChat::Message.find_by(id: params[:id])
    if @chat_message.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "Message not found"}]}, status: :not_found
    else
      if current_user == @chat_message.user
        if @chat_message.media.present? and @chat_message.created_at > Time.now - 24.hours
          @chat_message.media.destroy_all
          # @chat_message.save
        end
        if @chat_message.text.blank? and @chat_message.video_url.blank? and @chat_message.media.blank?
          @chat_message.destroy
        end

        @chat = @chat_message.chat
        @messages = @chat.messages.order(created_at: :desc).  # .where("wheel_chat_messages.created_at > ?", DateTime.yesterday)
            limit(30).to_a.sort {|current, _next| current.created_at <=> _next.created_at }    # limit 30 - default count
        render :recent_messages, status: :ok
      else
        render 'api/v1/shared/failure', locals: { errors: [{ message: 'access denied' }] }, status: :unauthorized
      end
    end
  end

  private

  def check_channel_name
    user_ids = params[:channel_name].split('_')
    if Integer(user_ids[0]) >= Integer(user_ids[1])
      raise ArgumentError
    end
  rescue ArgumentError => ae
    render 'api/v1/shared/failure', locals: {errors: [{message: 'Channel name is invalid'}]}, status: :unprocessable_entity
  end

  def find_chat
    @chat = ::WheelChat::Chat.find_by(channel_name: params[:channel_name])
    if @chat.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "Chat not found"}]}, status: :not_found
    end
  end

  def find_or_create_chat
    @chat = ::WheelChat::Chat.find_or_create_by(channel_name: params[:channel_name])
  end
end
