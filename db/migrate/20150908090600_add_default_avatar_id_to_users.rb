class AddDefaultAvatarIdToUsers < ActiveRecord::Migration
  def change
    add_column :users, :default_avatar_id, :integer
  end
end
