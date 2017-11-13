class Api::V1::ConfirmationsController < Devise::ConfirmationsController
  skip_before_action :authenticate_user_from_token!, only: [:create, :show, :resend]
  respond_to :json, except: :show
  respond_to :html, only: :show

  def resend
    user = User.where(email: params[:email]).first
    user.resend_confirmation_instructions unless user.blank?
    # We always return the same response, not depending on whether there were any errors (e.g. this email is not used) or not. [Security]
    render json: { result: {you: ['need to confirm your email address. Please check your email.']}, errors: [] }, status: :ok
  end

  protected
  # The path used after confirmation.
  # http://localhost:3000/api/v1/confirmations/24?confirmation_token=nhQTPMd5DcVTGpUb1YDM
  def after_confirmation_path_for(resource_name, resource)
    '/email_confirmed'
  end
end
