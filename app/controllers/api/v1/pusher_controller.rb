class Api::V1::PusherController < ApplicationController
  skip_before_action :authenticate_user_from_token!, only: :webhook

  def auth
    if current_user

      if params[:channel_name] =~ /\Aprivate\-user\-(?<user_id>\d+)\z/
        if current_user.id != Regexp.last_match[:user_id].to_i
          auth_failure and return
        end
      end

      presence_data = {
        user_id: current_user.id,
        user_info: {
          uname: current_user.username
        }
      }
      begin
        response = Pusher.authenticate(params[:channel_name], params[:socket_id], presence_data)
      rescue Pusher::Error => e
        Bugsnag.notify(e, {location: 'Api::V1::PusherController#auth', user_id: current_user.id})
        retry
      end

      render json: response
    else
      auth_failure
    end
  end

  def webhook
    webhook = Pusher::WebHook.new(request)
    if webhook.valid?
      webhook.events.each do |event|
        next if event['channel'].blank?

        # PRIVATE USER CHANNEL
        if event['channel'] =~ /\Aprivate\-user\-(?<user_id>\d+)\z/
          case event['name']
            when 'channel_occupied' then add_online_user(Regexp.last_match[:user_id])
            when 'channel_vacated' then remove_online_user(Regexp.last_match[:user_id])
          end

        # PRIVATE BUBBLE MEMBER CHANNEL
        elsif event['channel'] =~ /\Aprivate\-bubble\-(?<permalink>.{#{Bubble::PERMALINK_LENGTH}})\-(?<user_id>\d+)\z/
          case event['name']
            when 'channel_occupied' then add_online_bubble_member(Regexp.last_match[:permalink], Regexp.last_match[:user_id])
            when 'channel_vacated' then remove_online_bubble_member(Regexp.last_match[:permalink], Regexp.last_match[:user_id])
          end

        # PRIVATE CHAT WIDGET CHANNEL
        elsif event['channel'] =~ /\Apresence\-chatwidget\-online\-users\-(?<chat_id>\d+)\z/
          case event['name']
            when 'member_added', 'member_removed' then update_last_chat_visit_date(Regexp.last_match[:chat_id], event['user_id'])
          end
        end

      end

      head :ok
    else
      render text: 'invalid', status: 401
    end
  end

  private

  def auth_failure
    render text: 'Forbidden', status: '403'
  end

  def private_user_channel?
    event[:channel].present? and event[:channel] =~ /\Aprivate\-user\-(?<user_id>\d+)/
  end

  def add_online_user(user_id)
    Redis.current.sadd('bubblz:online_user_ids', user_id)
    user_id = user_id.to_i unless user_id.is_a?(Integer)
    user = User.select(:id, :username).find_by(id: user_id)

    # real-time notification
    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'online_user',
        data: {
            username: user.username,
            id: user.id
        },
        debug_info: {
            location: 'Api::V1::PusherController#add_online_user',
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def remove_online_user(user_id)
    Redis.current.srem('bubblz:online_user_ids', user_id)
    user_id = user_id.to_i unless user_id.is_a?(Integer)
    user = User.select(:id, :username).find_by(id: user_id)

    # real-time notification
    ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'offline_user',
        data: {
            username: user.username,
            id: user.id
        },
        debug_info: {
            location: 'Api::V1::PusherController#remove_online_user',
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def add_online_bubble_member(permalink, user_id)
    Redis.current.sadd("bubblz:bubble_#{permalink}:online_user_ids", user_id)
    user_id = user_id.to_i unless user_id.is_a?(Integer)
    user = User.select(:id, :username).find_by(id: user_id)

    # real-time notification
    ws_msg = {
        adapter: 'pusher',
        channel: "private-bubble-#{permalink}",
        event: 'online_user',
        data: {
            username: user.username,
            id: user.id
        },
        debug_info: {
            location: 'Api::V1::PusherController#add_online_bubble_member',
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def remove_online_bubble_member(permalink, user_id)
    Redis.current.srem("bubblz:bubble_#{permalink}:online_user_ids", user_id)
    user_id = user_id.to_i unless user_id.is_a?(Integer)
    user = User.select(:id, :username).find_by(id: user_id)

    # real-time notification
    ws_msg = {
        adapter: 'pusher',
        channel: "private-bubble-#{permalink}",
        event: 'offline_user',
        data: {
            username: user.username,
            id: user.id
        },
        debug_info: {
            location: 'Api::V1::PusherController#remove_online_bubble_member',
            user_id: user.id
        }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def update_last_chat_visit_date(chat_id, user_id)
    bubble = Widgets::ChatWidget::Chat.find_by(id: chat_id).try(:bubble)
    user = User.find_by(id: user_id)

    if bubble && user
      # UNREAD MESSAGES FEATURE
      attendance_attrs = {url: "/bubbles/#{bubble.permalink}", section: "bubble_chat"}
      attendance = user.attendances.find_by(attendance_attrs)

      if attendance.nil?
        user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now))
      else
        attendance.touch(:latest_date)
      end
      # UNREAD MESSAGES FEATURE
    end
  end


end
