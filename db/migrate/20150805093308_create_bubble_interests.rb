class CreateBubbleInterests < ActiveRecord::Migration
  def change
    create_table :bubble_interests do |t|
      t.references :bubble, index: true, foreign_key: true
      t.references :interest, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
