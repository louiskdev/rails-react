class AddNotificationIdToBubbleInvitations < ActiveRecord::Migration
  def change
    add_column :bubble_invitations, :notification_id, :integer
  end
end
