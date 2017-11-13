class UserMailer < ApplicationMailer

  def send_custom_email(email, subject, body)
    mail(to: email,
      subject: subject,
      content_type: "text/html",
      body: body)
  end

end
