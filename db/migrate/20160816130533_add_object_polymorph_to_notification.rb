class AddObjectPolymorphToNotification < ActiveRecord::Migration
  def change
    add_column :notifications, :object_type, :string
    add_column :notifications, :object_id,   :integer
  end
end
