class Hashtag < ActiveRecord::Base

  has_many :hashtag_posts, dependent: :destroy, counter_cache: :posts_count
  has_many :posts, through: :hashtag_posts
  has_many :hashtag_activities, dependent: :destroy
  has_many :activities, through: :hashtag_activities

end
