class RealTimeNotificationJob < ApplicationJob

  def perform(options)
    adapter = options.delete(:adapter)
    case adapter
      when 'pusher' then send_by_pusher(options)
    end
  end


  private

  def send_by_pusher(options)
    attempts = options[:attempts] || 10
    debug_info = options[:debug_info] || {test: 'test'}
    
    retry_if_error(attempts, debug_info) do
      if options[:channel].is_a?(Array)
        # limit 10 channels per request https://blog.pusher.com/multi-channel-event-publishing/
        options[:channel].each_slice(10) {|channels| Pusher.trigger(channels, options[:event], options[:data]) }
      else
        Pusher.trigger(options[:channel], options[:event], options[:data])
      end
    end
  end

  def retry_if_error(counter, debug_info, &block)
    tries ||= counter
    sleep(3) if tries != counter

    yield if block_given?

  rescue Pusher::Error => e
    retry unless (tries -= 1).zero?
    Bugsnag.notify(e, debug_info)
  end

end
