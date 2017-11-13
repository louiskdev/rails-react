class CreateAttachmentPictures < ActiveRecord::Migration
  def change
    create_table :attachment_pictures do |t|
      t.string :file
      t.timestamps null: false
    end
  end
end
