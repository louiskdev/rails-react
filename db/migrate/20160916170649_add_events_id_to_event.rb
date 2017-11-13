class AddEventsIdToEvent < ActiveRecord::Migration
  def change
    add_column :events, :events_id, :integer
  end
end
