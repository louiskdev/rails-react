class CreateUserAttendances < ActiveRecord::Migration
  def change
    create_table :user_attendances do |t|
      t.integer :user_id
      t.datetime :latest_date
      t.string :url
      t.string :section
      t.timestamps null: false
    end
  end
end
