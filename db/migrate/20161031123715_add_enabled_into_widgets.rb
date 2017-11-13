class AddEnabledIntoWidgets < ActiveRecord::Migration
  def change
    add_column :widgets, :enabled, :boolean, null: false, default: true
  end
end
