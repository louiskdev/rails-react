class RenameGroupIdToChannelIdInCallSessions < ActiveRecord::Migration
  def change
    rename_column :call_sessions, :group_id, :channel_id
  end
end
