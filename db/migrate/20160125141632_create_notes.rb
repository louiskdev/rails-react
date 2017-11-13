class CreateNotes < ActiveRecord::Migration
  def change
    create_table :notes do |t|
      t.text     :text
      t.integer  :user_id
      t.boolean  :private, default: true
      t.integer  :likers_count, default: 0

      t.timestamps null: false
    end
  end
end
