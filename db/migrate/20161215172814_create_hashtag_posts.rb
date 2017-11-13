class CreateHashtagPosts < ActiveRecord::Migration
  def change
    create_table :hashtag_posts do |t|
      t.integer :hashtag_id
      t.integer :post_id

      t.timestamps null: false
    end
  end
end
