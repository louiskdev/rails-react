class AddLikersCountToMediaTable < ActiveRecord::Migration
  def change
    add_column :media, :likers_count, :integer, default: 0
  end
end
