class UserAttendance < ActiveRecord::Base
  belongs_to :user

  validates :user_id, presence: true
  validates :latest_date, presence: true
  validates :user_id, uniqueness: { scope: [:url, :section] }
end
