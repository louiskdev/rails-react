# Be sure to restart your server when you modify this file.
Rails.application.configure do

  # A flag that controls whether the asset pipeline is enabled.
  config.assets.enabled = true

  # Version of your assets, change this if you want to expire all your assets.
  config.assets.version = '1.0'

  # Add additional assets to the asset load path
  # config.assets.paths << Emoji.images_path
  # Add folder with webpack generated assets to assets.paths
  config.assets.paths << Rails.root.join("app", "assets", "webpack")
  config.assets.paths << "#{Rails.root}/node_modules/bootstrap-sass/assets/stylesheets"
  config.assets.paths << "#{Rails.root}/node_modules/bootstrap-sass/assets/javascripts"
  config.assets.paths << "#{Rails.root}/app/assets/sounds"
  config.assets.paths << "#{Rails.root}/app/assets/fonts"
  # config.assets.paths << "#{Rails.root}/node_modules/font-awesome/scss"
  # config.assets.paths << "#{Rails.root}/node_modules/font-awesome/fonts"
  # config.assets.paths << Rails.root.join("node_modules", "bootstrap-sass", "assets", "stylesheets")
  # config.assets.paths << Rails.root.join("node_modules", "bootstrap-sass", "assets", "stylesheets", "bootstrap", "css")

  # Precompile additional assets.
  # application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
  # config.assets.precompile += %w( search.js )
  type = ENV["REACT_ON_RAILS_ENV"] == "HOT" ? "non_webpack" : "static"
  config.assets.precompile +=
      [
          "application_#{type}.js",
          "application_#{type}.css",
          "application_#{type}.scss",
          'server-bundle.js'
      ]
end
