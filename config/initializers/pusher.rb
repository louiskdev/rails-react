require 'pusher'

Pusher.app_id = ENV['PUSHER_APP_ID']
Pusher.key = ENV['PUSHER_KEY']
Pusher.secret = ENV['PUSHER_SECRET']
Pusher.encrypted = ENV['PUSHER_ENCRYPTED'].blank? ? false : ENV['PUSHER_ENCRYPTED'] == 'true' ? true : false
Pusher.logger = Rails.logger
Pusher.cluster = ENV['PUSHER_CLUSTER'] if ENV['PUSHER_CLUSTER'].present?
