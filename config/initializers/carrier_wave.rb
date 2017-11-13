CarrierWave.configure do |config|
  if ENV['AWS_ENABLED'] == 'true'
    config.fog_credentials = {
        provider:              'AWS',                               # required
        aws_access_key_id:     ENV.fetch('AWS_ACCESS_KEY_ID'),      # required
        aws_secret_access_key: ENV.fetch('AWS_ACCESS_KEY_SECRET'),  # required
        region:                ENV['AWS_REGION'],                   # optional, defaults to 'us-east-1'
        # host:                  's3.example.com',                  # optional, defaults to nil
        # endpoint:              'https://s3.example.com:8080'      # optional, defaults to nil
    }
    config.fog_directory  = ENV.fetch('AWS_S3_BUCKET')              # required
    # config.fog_public     = false                                 # optional, defaults to true
    # config.fog_attributes = {                                     # optional, defaults to {}
    #     'Cache-Control' => "max-age=#{365.day.to_i}"
    # }
    config.storage = :fog
  else
    config.storage = :file
  end
end