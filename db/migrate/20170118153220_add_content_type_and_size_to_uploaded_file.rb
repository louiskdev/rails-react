class AddContentTypeAndSizeToUploadedFile < ActiveRecord::Migration
  def change
    add_column :uploaded_files, :content_type, :string
    add_column :uploaded_files, :size, :integer
  end
end
