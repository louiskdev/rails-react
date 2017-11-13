class AddCoverImageToUser < ActiveRecord::Migration
  def change
    add_column :users, :cover_image, :string
  end
end
