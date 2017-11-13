class AddRecodingJobKeyColumnToAttachmentVideosTable < ActiveRecord::Migration
  def change
    add_column :attachment_videos, :recoding_job_key, :string
  end
end
