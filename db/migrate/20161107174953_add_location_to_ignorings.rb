class AddLocationToIgnorings < ActiveRecord::Migration
  def change
    add_column :ignorings, :location, :string
  end
end
