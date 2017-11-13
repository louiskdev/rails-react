class CreateBubbleMembers < ActiveRecord::Migration
  def change
    create_table :bubble_members do |t|
      t.references :user, index: true, foreign_key: true
      t.references :bubble, index: true, foreign_key: true
      t.integer :user_role, null: false

      t.timestamps null: false
    end
  end
end
