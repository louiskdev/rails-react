class AddLikersCountToBubble < ActiveRecord::Migration
  def change
    add_column :bubbles, :likers_count, :integer, default: 0
  end
end
