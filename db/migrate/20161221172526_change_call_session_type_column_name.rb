class ChangeCallSessionTypeColumnName < ActiveRecord::Migration
  def change
    rename_column :call_sessions, :type, :call_type
  end
end
