class FavoriteActivity < ActiveRecord::Base
  belongs_to :user
  belongs_to :activity

  validates :user_id, presence: true
  validates :activity_id,
            presence: true,
            uniqueness: { scope: :user_id }
end
