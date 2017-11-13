class UserInterest < ActiveRecord::Base
  belongs_to :user, counter_cache: :interests_count
  belongs_to :interest

  validates :user_id,
            presence: true,
            numericality: { only_integer: true }
  validates :interest_id,
            presence: true,
            numericality: { only_integer: true }
  validates :user_id, uniqueness: { scope: :interest_id }

  after_create :increment_interest_counter

  private
  def increment_interest_counter
    interest = Interest.find(self.interest_id)
    interest.update(counter: interest.counter + 1)
  end
end
