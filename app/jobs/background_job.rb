class BackgroundJob < ApplicationJob
  queue_as :default

  def perform(klass, method, *args)
    klass.constantize.send(method, *args)
  end

end
