class CreateFeedbacks < ActiveRecord::Migration
  def change
    create_table :feedbacks do |t|
      t.boolean :use_another_social
      t.string :use_another_social_period
      t.integer :score
      t.string :name
      t.string :email
      t.string :title
      t.text :content

      t.timestamps null: false
    end
  end
end
