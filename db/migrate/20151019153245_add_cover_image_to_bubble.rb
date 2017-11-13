class AddCoverImageToBubble < ActiveRecord::Migration
  def change
    add_column :bubbles, :cover_image, :string
  end
end
