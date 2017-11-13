class CreateAttachmentVideos < ActiveRecord::Migration
  def change
    create_table :attachment_videos do |t|
      t.string :file
      t.string :source_area
      t.timestamps null: false
    end
  end
end
