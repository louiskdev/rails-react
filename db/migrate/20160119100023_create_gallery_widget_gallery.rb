class CreateGalleryWidgetGallery < ActiveRecord::Migration
  def change
    create_table :gallery_widget_galleries do |t|
      t.timestamps null: false
    end
  end
end
