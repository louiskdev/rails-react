# encoding: utf-8

class PictureUploader < CarrierWave::Uploader::Base

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
  # def default_url
  #   # For Rails 3.1+ asset pipeline compatibility:
  #   # ActionController::Base.helpers.asset_path("fallback/" + [version_name, "default.png"].compact.join('_'))
  #
  #   "/images/fallback/" + [version_name, "default.png"].compact.join('_')
  # end

  # Process files as they are uploaded:

  # resize the image to fit within the specified dimensions (max_width=1200 max_height=1200) while retaining the original aspect ratio
  process resize_to_limit: [1200, 1200]

  # process :scale => [200, 300]
  #
  # def scale(width, height)
  #   # do something
  # end

  def gif?(obj)
    obj.file_url.downcase =~ /\.gif\z/
  end

  def process_gif
    system "convert #{current_path} -coalesce -repage 0x0 #{current_path}"
  end

  def picture_processor(width, height, gravity=Magick::NorthGravity)
    process_gif if gif?(model)
    resize_to_fill(width, height, gravity)
  end

  def resize_picture(width, height)
    process_gif if gif?(model)
    resize_to_limit(width, height)
  end

  #Create different versions of your uploaded files:
  version :big_square do
    process :resize_picture => [500, 500]
  end

  version :thumb do
    process :picture_processor => [250, 250]
  end

  version :small_square, from_version: :thumb do
    process :picture_processor => [180, 180]
  end

  version :lscape do
    process :picture_processor => [500, 250]
  end

  version :small_lscape, from_version: :lscape do
    process :picture_processor => [250, 180]
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
