class CreateFilesWidgetFiles < ActiveRecord::Migration
  def change
    create_table :files_widget_files do |t|
      t.timestamps null: false
    end
  end
end
