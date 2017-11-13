class AddLikersCountToAlbumsTable < ActiveRecord::Migration
  def change
    add_column :albums, :likers_count, :integer, default: 0
  end
end
