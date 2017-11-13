class Api::V1::NotificationsController < ApplicationController
  before_action :find_notification, only: :destroy

  def destroy
    if @notification.user_id == current_user.id
      @notification.destroy

      @notifications = current_user.unread_notifications.all
      render 'api/v1/users/unread_notifications', status: :ok
    else
      render 'api/v1/shared/failure', locals: { errors: [{ message: 'Record not found or access denied' }]}, status: :not_found
    end
  end

  def destroy_all
    Notification.where(user_id: current_user.id).destroy_all
    @notifications = current_user.unread_notifications.all
    render 'api/v1/users/unread_notifications', status: :ok
  end

  private

  def find_notification
    @notification = Notification.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render 'api/v1/shared/failure', locals: { errors: [{ message: 'Record not found or access denied' }]}, status: :not_found
  end

end
