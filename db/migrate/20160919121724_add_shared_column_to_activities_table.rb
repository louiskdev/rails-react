class AddSharedColumnToActivitiesTable < ActiveRecord::Migration
  def change
    add_column :activities, :shared, :boolean, default: false
  end
end
