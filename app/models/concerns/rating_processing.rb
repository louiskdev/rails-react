module RatingProcessing
  extend ActiveSupport::Concern

  included do
    has_many :ratings, as: :ratingable, dependent: :destroy

    def rating
      rating_values = ratings.map {|el| el.value }
      rating_values.empty? ? 0 : (rating_values.reduce(:+) / rating_values.size.to_f).round(2)
    end

    def rating_info
      rating_values = ratings.map {|el| el.value }
      rating_values.empty? ? [0, 0] : [(rating_values.reduce(:+) / rating_values.size.to_f).round(2), rating_values.size]
    end

    def rating_from(user)
      ratings.find_by(user_id: user.id).try(:value)
    end

  end
end
