class CreateCallSessions < ActiveRecord::Migration
  def change
    create_table :call_sessions do |t|
      t.integer :initiator_id
      t.integer :receiver_id
      t.string :session_id
      t.string :type

      t.timestamps null: false
    end
  end
end
