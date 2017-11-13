class CreateActiveUsers < ActiveRecord::Migration
  def change
    create_table :active_users do |t|
      t.date :date
      t.integer :count
    end
  end
end
