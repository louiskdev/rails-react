class Api::V1::FeedbackController < ApplicationController
  # before_action :authenticate_user_from_access_token, only: :create

  def create
    feedback = Feedback.new(
      use_another_social: params[:use_another_social],
      use_another_social_period: params[:use_another_social_period],
      score: params[:score],
      content: params[:content]
    )
    if feedback.save
      FeedbackMailer.new_feedback("rschatz@mybubblz.com", params).deliver_now
      FeedbackMailer.new_feedback("dimitri@mybubblz.com", params).deliver_now
      render :json => { :status => true }
    else
      render :json => { :status => false }
    end
  end

end
