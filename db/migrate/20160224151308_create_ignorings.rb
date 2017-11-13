class CreateIgnorings < ActiveRecord::Migration
  def change
    create_table :ignorings do |t|
      t.integer  :user_id
      t.string   :ignorable_type
      t.integer  :ignorable_id

      t.timestamps null: false
    end
  end
end
