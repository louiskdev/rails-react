class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('EMAIL_DEFAULT_FROM')
  # layout 'mailer'
end
