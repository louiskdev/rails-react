class AddMembersCountToBubble < ActiveRecord::Migration
  def up
    add_column :bubbles, :members_count, :integer, null: false, default: 0

    Bubble.ids.each do |id|
      Bubble.reset_counters(id, :members_count)
    end
  end

  def down
    remove_column :bubbles, :members_count
  end
end
