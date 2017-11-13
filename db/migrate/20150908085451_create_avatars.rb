class CreateAvatars < ActiveRecord::Migration
  def change
    create_table :avatars do |t|
      t.string   :picture
      t.string   :avatarable_type
      t.integer  :avatarable_id
      t.integer  :kind

      t.timestamps null: false
    end
  end
end
