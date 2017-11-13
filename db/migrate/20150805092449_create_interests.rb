class CreateInterests < ActiveRecord::Migration
  def change
    create_table :interests do |t|
      t.string  :name
      t.integer :counter, null: false, default: 0

      t.timestamps null: false
    end

    add_index :interests, :name
  end
end
