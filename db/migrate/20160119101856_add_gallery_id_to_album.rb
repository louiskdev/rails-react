class AddGalleryIdToAlbum < ActiveRecord::Migration
  def change
    add_column :albums, :gallery_id, :integer
  end
end
