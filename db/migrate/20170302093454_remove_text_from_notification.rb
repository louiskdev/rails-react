class RemoveTextFromNotification < ActiveRecord::Migration
  def change
    remove_column :notifications, :text, :string
  end
end
