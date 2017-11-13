class AddPrivacyToAlbum < ActiveRecord::Migration
  def change
    add_column :albums, :privacy, :integer

    Album.update_all(privacy: Album.privacies[:p_private])
  end
end
