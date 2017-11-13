class CreateSharedDocs < ActiveRecord::Migration
  def change
    create_table :shared_docs do |t|
      t.integer :owner_id
      t.integer :bubble_id
      t.string :doc_id_external
      t.timestamps null: false
    end
  end
end
