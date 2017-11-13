class AddBubblesCountToUser < ActiveRecord::Migration
  def up
    add_column :users, :bubbles_count, :integer, null: false, default: 0

    User.ids.each do |id|
      User.reset_counters(id, :bubbles_count)
    end
  end

  def down
    remove_column :users, :bubbles_count
  end
end
