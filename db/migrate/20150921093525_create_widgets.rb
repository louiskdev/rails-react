class CreateWidgets < ActiveRecord::Migration
  def change
    create_table :widgets do |t|
      t.string   :widgetable_type
      t.integer  :widgetable_id
      t.integer  :bubble_id

      t.timestamps null: false
    end
  end
end
