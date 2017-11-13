class CreateVisits < ActiveRecord::Migration
  def change
    create_table :visits do |t|
      t.integer :user_id
      t.integer :visitable_id
      t.string  :visitable_type

      t.datetime :created_at, null: false
    end
  end
end
