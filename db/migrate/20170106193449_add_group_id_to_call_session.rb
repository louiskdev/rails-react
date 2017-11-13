class AddGroupIdToCallSession < ActiveRecord::Migration
  def change
    add_column :call_sessions, :group_id, :integer, :default => 0
  end
end
