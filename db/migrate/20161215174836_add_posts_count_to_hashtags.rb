class AddPostsCountToHashtags < ActiveRecord::Migration
  def change
    add_column :hashtags, :posts_count, :integer
  end
end
