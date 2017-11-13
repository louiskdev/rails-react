class AddInterestsCountToUser < ActiveRecord::Migration
  def up
    add_column :users, :interests_count, :integer, null: false, default: 0

    User.ids.each do |id|
      User.reset_counters(id, :interests_count)
    end
  end

  def down
    remove_column :users, :interests_count
  end
end
