class CreateEvents < ActiveRecord::Migration
  def change
    create_table :events do |t|
      t.string :name
      t.string :permalink
      t.string :cover_image
      t.string :kind
      t.integer :owner_id
      t.integer :likers_count
      t.integer :members_count
      t.datetime :start_date
      t.text :description

      t.timestamps null: false
    end
  end
end
