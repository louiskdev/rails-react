class CreateBubbleBlockedUsers < ActiveRecord::Migration
  def change
    create_table :bubble_blocked_users do |t|
      t.integer :bubble_id
      t.integer :user_id

      t.timestamps null: false
    end
  end
end
