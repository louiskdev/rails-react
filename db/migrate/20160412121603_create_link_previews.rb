class CreateLinkPreviews < ActiveRecord::Migration
  def change
    create_table :link_previews do |t|
      t.string :url
      t.string :title
      t.text :description
      t.string :picture_url
      t.string :link_previewable_type
      t.integer :link_previewable_id
      t.timestamps null: false
    end
  end
end
