class AddFileToUploadedFiles < ActiveRecord::Migration
  def change
    add_column :uploaded_files, :file, :string
  end
end
