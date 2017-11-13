require 'koala'

class Api::V1::FacebookController < ApplicationController
  before_action :authenticate_user_from_access_token, only: :create

  def authorize
    Koala.config.api_version = "v2.8"
    @oauth = Koala::Facebook::OAuth.new(ENV['FACEBOOK_API_KEY'], ENV['FACEBOOK_API_SECRET'], params[:callback_url])
    access_token = @oauth.get_access_token params[:code]
    render :json => { :access_token => access_token }
  end

end
