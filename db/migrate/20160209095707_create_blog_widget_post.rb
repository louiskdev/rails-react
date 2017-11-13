class CreateBlogWidgetPost < ActiveRecord::Migration
  def change
    create_table :blog_widget_posts do |t|
      t.text    :text
      t.string  :title
      t.integer :user_id
      t.integer :blog_id
      t.integer :likers_count, default: 0

      t.timestamps null: false
    end
  end
end
