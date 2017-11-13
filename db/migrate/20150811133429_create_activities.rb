class CreateActivities < ActiveRecord::Migration
  def change
    create_table :activities do |t|
      t.string     :name
      t.references :user, index: true, foreign_key: true
      t.inet       :user_ip
      t.string     :object_type
      t.integer    :object_id
      t.integer    :bubble_id
      t.boolean    :feed, default: false
      t.integer    :privacy
      t.hstore     :extra_data

      t.timestamps null: false
    end
  end
end
