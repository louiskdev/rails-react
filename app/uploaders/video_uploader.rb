# encoding: utf-8

class VideoUploader < CarrierWave::Uploader::Base

  # Include RMagick or MiniMagick support:
  # include CarrierWave::RMagick
  # include CarrierWave::MiniMagick
  include CarrierWave::MimeTypes
  after :store, :zencode

  # Choose what kind of storage to use for this uploader:
  # moved to carrier_wave.rb initializer
  # storage :file
  # storage :fog

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    "uploads/#{model.class.to_s.underscore}/#{mounted_as}/#{model.id}"
  end

  # Add a white list of extensions which are allowed to be uploaded.
  # For images you might use something like this:
  def extension_white_list
    %w(avi mkv mpg mpeg mp4 m4a m4v f4v f4a m4b m4r f4b mov webm ogg oga ogv ogx flv wmv wma 3gp 3gp2 3g2 3gpp 3gpp2)
  end

  # Provide a default URL as a default if there hasn't been a file uploaded:
  # def default_url
  #   # For Rails 3.1+ asset pipeline compatibility:
  #   # ActionController::Base.helpers.asset_path("fallback/" + [version_name, "default.png"].compact.join('_'))
  #
  #   "/images/fallback/" + [version_name, "default.png"].compact.join('_')
  # end

  # content types for media
  process :set_content_type

  # Override the filename of the uploaded files:
  # Avoid using model.id or version_name here, see uploader/store.rb for details.
  # def filename
  #   "something.jpg" if original_filename
  # end

  def mp4_url
    @mp4_url ||= url_for_format('mp4')
  end

  def webm_url
    @webm_url ||= url_for_format('webm')
  end

  def ogv_url
    @ogv_url ||= url_for_format('ogv')
  end

  def thumb_url
    @thumb_url ||= url_for_format('thumb', 'png')
  end

  def big_square_url
    @big_square_url ||= url_for_format('big_square', 'png')
  end

  def small_square_url
    @small_square_url ||= url_for_format('small_square', 'png')
  end

  def lscape_url
    @lscape_url ||= url_for_format('lscape', 'png')
  end

  def small_lscape_url
    @small_lscape_url ||= url_for_format('small_lscape', 'png')
  end

  private

  def to_boolean(str)
    str == 'true'
  end

  def zencoder_input_url
    if to_boolean(ENV['ZENCODER_STUB_INPUT'])
      "s3://zencodertesting/test.mov"
    elsif to_boolean(ENV['AWS_ENABLED'])
      self.url
    else
      "#{ENV['PROTOCOL']}://#{ENV['APP_HOST']}#{self.url}"
    end
  end

  def zencoder_notifications_url
    to_boolean(ENV['ZENCODER_USE_FETCHER']) ? "http://zencoderfetcher" : "#{ENV['PROTOCOL']}://#{ENV['APP_HOST']}/api/v1/zencoder"
  end

  def zencode(*args)
    bubblz_logo_watermark = {
        :url     => "http://dev.mybubblz.com/assets/logo_small.png",
        :opacity => 0.5,
        :x       => "-50",
        :y       => "50",
        :width   => 114,
        :height  => 114
    }

    params = {
      :input         => zencoder_input_url,
      #:test          => true, # https://app.zencoder.com/docs/guides/getting-started/test-jobs-and-integration-mode
      :notifications => zencoder_notifications_url,  # This is to facilitate local development using Zencoder Fetcher - https://app.zencoder.com/docs/guides/advanced-integration/getting-zencoder-notifications-while-developing-locally
      :pass_through  => model.id,
      :outputs => [
        {
          :public      => true,
          :base_url    => upload_base_url,
          :filename    => 'mp4_' + filename_without_ext + '.mp4',
          :label       => 'webmp4',
          :format      => 'mp4',
          :audio_codec => 'aac',
          :video_codec => 'h264',
          :watermarks  => [bubblz_logo_watermark],
          :thumbnails  => [
              {
                  :public       => true,
                  :base_url     => upload_base_url,
                  :number       => 1,
                  :filename     => "thumb_#{filename_without_ext}",
                  :label        => "thumb",
                  :width        => 250,
                  :height       => 250,
                  :aspect_mode  => 'crop'
              },
              {
                  :public       => true,
                  :base_url     => upload_base_url,
                  :number       => 1,
                  :filename     => "big_square_#{filename_without_ext}",
                  :label        => "big_square",
                  :width        => 500,
                  :height       => 500,
                  :aspect_mode  => 'stretch'
              },
              {
                  :public       => true,
                  :base_url     => upload_base_url,
                  :number       => 1,
                  :filename     => "small_square_#{filename_without_ext}",
                  :label        => "small_square",
                  :width        => 180,
                  :height       => 180,
                  :aspect_mode  => 'pad'
              },
              {
                  :public       => true,
                  :base_url     => upload_base_url,
                  :number       => 1,
                  :filename     => "lscape_#{filename_without_ext}",
                  :label        => "lscape",
                  :width        => 500,
                  :height       => 250,
                  :aspect_mode  => 'crop'
              },
              {
                  :public       => true,
                  :base_url     => upload_base_url,
                  :number       => 1,
                  :filename     => "small_lscape_#{filename_without_ext}",
                  :label        => "small_lscape",
                  :width        => 250,
                  :height       => 180,
                  :aspect_mode  => 'crop'
              }
          ]
        },
        {
          :public      => true,
          :base_url    => upload_base_url,
          :filename    => 'webm_' + filename_without_ext + '.webm',
          :label       => 'webwebm',
          :format      => 'webm',
          :audio_codec => 'vorbis',
          :video_codec => 'vp8',
          :watermarks  => [bubblz_logo_watermark]
        },
        {
          :public      => true,
          :base_url    => upload_base_url,
          :filename    => 'ogv_' + filename_without_ext + '.ogv',
          :label       => 'webogv',
          :format      => 'ogv',
          :audio_codec => 'vorbis',
          :video_codec => 'theora',
          :watermarks  => [bubblz_logo_watermark]
        }
      ]
    }

    response = Zencoder::Job.create(params)
    model.recoding_job_key = response.body['id']
    model.save(validate: false)
  end

  def filename_without_ext
    @filename_without_ext ||= File.basename(self.url, File.extname(self.url))
  end

  def store_to_path
    ENV.fetch('ZENCODER_STORE_TO_PATH') || store_dir
  end

  def pull_from_path
    ENV.fetch('ZENCODER_PULL_FROM_PATH') || store_dir
  end

  def upload_base_url
    @upload_base_url ||= if to_boolean(ENV['AWS_ENABLED'])
                           File.dirname(self.url)
                         else
                           "#{store_to_path}#{File.dirname(self.url)}"
                         end
  end

  def base_url
    @base_url ||= if to_boolean(ENV['AWS_ENABLED'])
                    File.dirname(self.url)
                  else
                    "#{pull_from_path}#{File.dirname(self.url)}"
                  end
  end

  def url_for_format(prefix, extension = nil)
    extension ||= prefix
    base_url + '/' + prefix + '_' + filename_without_ext + '.' + extension
  end

end
