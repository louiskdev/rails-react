class FeedbackMailer < ApplicationMailer

  def new_feedback(email, params)
    if params[:use_another_social]
      @use_another_social = "Yes"
    else
      @use_another_social = "No"
    end

    if params[:use_another_social_period] == "lt_30min"
      @time_spent_on_another_social = "Less than 30 minutes"
    elsif params[:use_another_social_period] == "30m_1h"
      @time_spent_on_another_social = "30 minutes to an hour"
    else
      @time_spent_on_another_social = "More than an hour"
    end

    @feedback_score = params[:score]
    @comment = params[:content]

    mail(to: email, subject: "<MyBubblz.com> Feedback")
  end

end
