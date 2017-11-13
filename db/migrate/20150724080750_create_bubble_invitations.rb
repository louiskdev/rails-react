class CreateBubbleInvitations < ActiveRecord::Migration
  def change
    create_table :bubble_invitations do |t|
      t.string      :token
      t.integer     :status
      t.references  :bubble, index: true, foreign_key: true
      t.integer     :new_member_id
      t.string      :new_member_email
      t.integer     :moderator_id
      t.integer     :originator

      t.timestamps null: false
    end
  end
end
