# encoding: utf-8

class AvatarUploader < CarrierWave::Uploader::Base

  # Include RMagick or MiniMagick support:
  include CarrierWave::RMagick
  # include CarrierWave::MiniMagick

  # Choose what kind of storage to use for this uploader:
  # moved to carrier_wave.rb initializer
  # storage :file
  # storage :fog

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    "uploads/#{model.class.to_s.underscore}/#{mounted_as}/#{model.id}"
  end

  # Provide a default URL as a default if there hasn't been a file uploaded:
  def default_url
    # For Rails 3.1+ asset pipeline compatibility:
    # ActionController::Base.helpers.asset_path("fallback/" + [version_name, "default.png"].compact.join('_'))
    ActionController::Base.helpers.asset_path('assets/defaults/'+ [version_name, 'default_avatar.jpg'].compact.join('_'))

    # "/images/fallback/" + [version_name, "default.png"].compact.join('_')
  end

  # def chop
  #   if model.crop_h.present? and model.crop_w.present? and model.crop_x.present? and model.crop_y.present?
  #     manipulate! do |image|
  #       image.chop(model.crop_x, model.crop_y, model.crop_w, model.crop_h)
  #     end
  #   end
  # end
  #
  # def rotate
  #   if model.rotation_angle.present?
  #     manipulate! do |image|
  #       image.rotate!(model.rotation_angle)
  #     end
  #   end
  # end
  #
  # process :chop
  # process :rotate
  # resize the image to fit within the specified dimensions (max_width=1200 max_height=1200) while retaining the original aspect ratio
  # process resize_to_fit: [1200, 1200]
  process resize_to_limit: [1200, 1200]

  # Process files as they are uploaded:
  # process :scale => [200, 300]
  #
  # def scale(width, height)
  #   # do something
  # end

  # Create different versions of your uploaded files:
  version :thumb do
    process :resize_to_fill => [160, 160]
  end

  version :micro, from_version: :thumb do
    process :resize_to_fill => [80, 80]
  end

  # Add a white list of extensions which are allowed to be uploaded.
  # For images you might use something like this:
  def extension_white_list
    %w(jpg jpeg gif png)
  end

  # Override the filename of the uploaded files:
  # Avoid using model.id or version_name here, see uploader/store.rb for details.
  # def filename
  #   "something.jpg" if original_filename
  # end

end
