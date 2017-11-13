class Api::V1::ZencodersController < ApplicationController
  skip_before_action :authenticate_user_from_token!

  def create
    video = Attachments::Video.find_by(id: params[:job][:pass_through])
    if video.present? && params[:job][:state] == 'finished'
      video.update(recoding_job_key: nil)

      # media_video = video.medium
      # # FIXME need refactoring!!!!
      # if media_video.mediable_id.present?
      #   message = {video: {message_id: media_video.mediable_id, mediable_type: media_video.mediable_type, links: video.try(:links),
      #                      thumbnail: video.try(:thumbnail), source_area: video.try(:source_area)}
      #   }
      # else
      #   message = {video: {message_id: media_video.id, links: video.try(:links),
      #                      thumbnail: video.try(:thumbnail), source_area: video.try(:source_area)}
      #   }
      # end
      # channel_name = case media_video.mediable_type
      #                  when 'Widgets::ChatWidget::Message' then "private-chatwidget-#{video.try(:source_area)}"
      #                  when 'WheelChat::Message' then "private-messages_#{video.try(:source_area)}"
      #                  else
      #                    "private-user-#{media_video.user_id}"
      #                end
      # # real-time notification
      # # Pusher.trigger(channel_name, 'video_uploaded', message)
      # ws_msg = {
      #     adapter: 'pusher',
      #     channel: channel_name,
      #     event: 'video_uploaded',
      #     data: message,
      #     debug_info: {
      #         location: 'Api::V1::ZencodersController#create',
      #         user_id: media_video.try(:user_id),
      #         video_id: video.id  # params[:job][:pass_through]
      #     }
      # }
      # RealTimeNotificationJob.perform_later(ws_msg)
    end

    head :ok
  end

end
