class CreateMedia < ActiveRecord::Migration
  def change
    create_table :media do |t|
      t.string     :title
      t.references :user, index: true, foreign_key: true
      t.references :album, index: true, foreign_key: true
      t.string     :attachmentable_type
      t.integer    :attachmentable_id
      t.string     :mediable_type
      t.integer    :mediable_id

      t.timestamps null: false
    end
  end
end
