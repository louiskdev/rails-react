class AddUserInvitesCountColumnToUsersTable < ActiveRecord::Migration
  def change
    add_column :users, :user_invites_count, :integer, default: 0, null: false
  end
end
