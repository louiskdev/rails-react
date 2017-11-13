require File.expand_path('../boot', __FILE__)

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module MybubblesReact
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :ru

    # Do not swallow errors in after_commit/after_rollback callbacks.
    config.active_record.raise_in_transactional_callbacks = true

    # Use resque as background worker
    config.active_job.queue_adapter = :resque

    # autoload /lib classes
    config.autoload_paths << "#{Rails.root}/lib"

    # autoload GraphQL directories
    %w(query_fields types mutations interfaces unions helpers).each do |dir|
      config.autoload_paths << Rails.root.join('app', 'graph', dir)
    end

    # disable some scaffold generators
    config.generators do |g|
      g.helper false
      g.assets false
      g.test_framework false
      g.orm :active_record
    end

    config.after_initialize do
      ws_msg = {
        adapter: 'pusher',
        channel: 'global',
        event: 'version_updated'
      }
      RealTimeNotificationJob.perform_later(ws_msg)
    end

  end
end
