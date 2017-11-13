class CreateBlogWidgetBlog < ActiveRecord::Migration
  def change
    create_table :blog_widget_blogs do |t|
      t.timestamps null: false
    end
  end
end
