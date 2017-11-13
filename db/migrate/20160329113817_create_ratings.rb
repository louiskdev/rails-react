class CreateRatings < ActiveRecord::Migration
  def change
    create_table :ratings do |t|
      t.integer :value, default: 0, null: false
      t.integer :user_id
      t.integer :ratingable_id
      t.string  :ratingable_type

      t.timestamps null: false
    end
  end
end
