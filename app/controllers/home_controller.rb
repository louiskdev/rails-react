class HomeController < ApplicationController
  skip_before_action :authenticate_user_from_token!, only: :index
  after_action :allow_facebook_iframe

  respond_to :html

  def index
  end

private
  
  def allow_facebook_iframe
    response.headers['X-Frame-Options'] = 'ALLOW-FROM https://apps.facebook.com'
  end

end
