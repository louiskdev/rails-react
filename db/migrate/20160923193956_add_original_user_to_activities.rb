class AddOriginalUserToActivities < ActiveRecord::Migration
  def change
    add_column :activities, :original_user_id, :int
  end
end
