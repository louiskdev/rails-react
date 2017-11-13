class AddLatitudeAndLongitudeToBubble < ActiveRecord::Migration
  def change
    add_column :bubbles, :latitude, :float
    add_column :bubbles, :longitude, :float

    add_index :bubbles, [:latitude, :longitude]
  end
end
