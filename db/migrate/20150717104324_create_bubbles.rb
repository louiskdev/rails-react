class CreateBubbles < ActiveRecord::Migration
  def change
    create_table :bubbles do |t|
      t.string   :name
      t.string   :description
      t.string   :zip_code
      t.string   :permalink
      t.integer  :kind, null: false
      t.boolean  :invitable

      t.timestamps null: false
    end
  end
end
