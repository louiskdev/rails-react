class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session
  respond_to :json

  before_bugsnag_notify :add_user_info_to_bugsnag

  before_action :authenticate_user_from_token!, if: :user_api_controller?

  ##
  # User Authentication
  # Authenticates the user with OAuth2 Resource Owner Password Credentials Grant
  def authenticate_user_from_token!
    auth_token = request.headers['Authorization']
    client_id  = request.headers['Client-ID']

    if auth_token
      authenticate_with_auth_token(auth_token, client_id)
    else
      authentication_error
    end
  end

  private

  def add_user_info_to_bugsnag(notif)
    notif.user = {
      id: current_user.id,
      email: current_user.email,
      zip_code: current_user.zip_code,
      latitude: current_user.latitude,
      longitude: current_user.longitude,
      created_at: current_user.created_at,
      confirmed_at: current_user.confirmed_at,
      completed: current_user.completed,
      ip: current_user.current_sign_in_ip
    }
  end


  def authenticate_with_auth_token(auth_token, client_id)
    unless auth_token.include?(':')
      authentication_error
      return
    end

    user_id = auth_token.split(':').first
    user = User.joins(:api_keys).find_by(id: user_id, api_keys: {client_id: client_id})
    if user.nil?
      authentication_error and return
    end

    if Rails.configuration.auth_token_expired_at and user.current_sign_in_at.present?
      if user.current_sign_in_at + Rails.configuration.auth_token_expired_at < DateTime.now.utc
        ApiKey.destroy_all(user_id: user.id, client_id: client_id, access_token: auth_token)
        authentication_error
        return
      end
    end

    apik = user.present? ? user.api_keys.find_by(client_id: client_id) : nil
    if apik && Devise.secure_compare(apik.access_token, auth_token)
      unless user.completed?
        if controller_name == 'users'
          incomplete_profile_error and return if action_name != 'update'
        else
          incomplete_profile_error and return
        end
      end
      # User can access
      apik.touch
      user.current_client_id = client_id
      sign_in user, store: false
    else
      authentication_error
    end
  end

  ##
  # Authentication Failure
  # Renders a 401 error
  def authentication_error
    # User's token is either invalid or not in the right format
    render 'api/v1/shared/failure', locals: { errors: [{ user: ['is unauthorized'] }] }, status: :unauthorized # Authentication timeout
  end

  def incomplete_profile_error
    render 'api/v1/shared/failure', locals: { errors: [{ user: ['has incomplete profile'] }] }, status: :unauthorized
  end

  def user_api_controller?
    devise_controller? or (controller_path =~ /\Aapi\/v1\// and !show_bubble_with_token)
  end

  def show_bubble_with_token
    (params[:controller] == 'api/v1/bubbles') and (params[:action] == 'show') and (params[:new_member_token].present?)
  end

  # parse params[:page] in request
  def parse_page_param
    if params[:page].present?
      begin
        page_number = params[:page].to_i
        raise StandardError if page_number <= 0
        return page_number - 1
      rescue Exception
        render 'api/v1/shared/failure', locals: {errors: [{page: 'parameter is wrong'}]}, status: :unprocessable_entity
        return
      end
    else
      return 0
    end
  end

end
