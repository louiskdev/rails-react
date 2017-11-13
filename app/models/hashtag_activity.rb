class HashtagActivity < ActiveRecord::Base

  belongs_to :activity
  belongs_to :hashtag

end
