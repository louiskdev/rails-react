class AddCompletedColumnToUsersTable < ActiveRecord::Migration
  def up
    add_column :users, :completed, :boolean, null: false, default: false

    User.find_in_batches do |users|
      users.each do |user|
        user.update_column(:completed, true) unless user.first_name.blank?
      end
    end
  end

  def down
    remove_column :users, :completed
  end
end
