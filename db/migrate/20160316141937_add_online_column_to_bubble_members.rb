class AddOnlineColumnToBubbleMembers < ActiveRecord::Migration
  def change
    add_column :bubble_members, :online, :boolean, default: false
  end
end
