class AddInterestsCountToBubble < ActiveRecord::Migration
  def up
    add_column :bubbles, :interests_count, :integer, null: false, default: 0

    Bubble.ids.each do |id|
      Bubble.reset_counters(id, :interests_count)
    end
  end

  def down
    remove_column :bubbles, :interests_count
  end
end
