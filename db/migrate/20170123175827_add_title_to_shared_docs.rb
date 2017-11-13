class AddTitleToSharedDocs < ActiveRecord::Migration
  def change
    add_column :shared_docs, :title, :string, :default => ''
  end
end
