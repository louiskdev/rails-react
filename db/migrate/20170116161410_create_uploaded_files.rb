class CreateUploadedFiles < ActiveRecord::Migration
  def change
    create_table :uploaded_files do |t|
      t.integer :owner_id
      t.integer :bubble_id
      t.string :url
      t.integer :downloads
      t.datetime :created_at
    end
  end
end
