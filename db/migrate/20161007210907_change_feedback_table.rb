class ChangeFeedbackTable < ActiveRecord::Migration
  def change
    remove_column :feedbacks, :name
    remove_column :feedbacks, :title
    remove_column :feedbacks, :email
  end
end
