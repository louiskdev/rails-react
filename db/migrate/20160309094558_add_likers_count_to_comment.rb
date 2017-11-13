class AddLikersCountToComment < ActiveRecord::Migration
  def change
    add_column :comments, :likers_count, :integer, default: 0
  end
end
