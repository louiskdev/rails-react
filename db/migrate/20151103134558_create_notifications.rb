class CreateNotifications < ActiveRecord::Migration
  def change
    create_table :notifications do |t|
      t.string :name
      t.string :text
      t.datetime :read_at
      t.integer :user_id
      t.string :initiator_type
      t.integer :initiator_id
      t.hstore :extra_data

      t.timestamps null: false
    end
  end
end
