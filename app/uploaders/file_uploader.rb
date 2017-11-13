# encoding: utf-8

class FileUploader < CarrierWave::Uploader::Base

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    # "uploads/bubble/"
    "uploads/files/bubble/#{model.bubble_id}"
  end

  process :save_content_type_and_size_in_model

  def save_content_type_and_size_in_model
    model.content_type = file.content_type if file.content_type
    model.size = file.size
  end

end
