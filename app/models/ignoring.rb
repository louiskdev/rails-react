class Ignoring < ActiveRecord::Base

  belongs_to :user
  belongs_to :ignorable, polymorphic: true

  validates :user_id, presence: true
  validates :user_id, uniqueness: { scope: [:ignorable_id, :ignorable_type] }
end
