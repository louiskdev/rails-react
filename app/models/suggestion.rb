class Suggestion < ActiveRecord::Base

  validates :keyword,
            presence: true,
            uniqueness: true

end
