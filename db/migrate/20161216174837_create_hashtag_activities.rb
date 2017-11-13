class CreateHashtagActivities < ActiveRecord::Migration
  def change
    create_table :hashtag_activities do |t|
      t.integer :hashtag_id
      t.integer :activity_id

      t.timestamps null: false
    end
  end
end
