class BubbleInterest < ActiveRecord::Base
  belongs_to :bubble, counter_cache: :interests_count
  belongs_to :interest

  validates :bubble_id, uniqueness: { scope: :interest_id }
end
