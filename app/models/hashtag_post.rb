class HashtagPost < ActiveRecord::Base

  belongs_to :post, class_name: "Widgets::BlogWidget::Post", foreign_key: :post_id
  belongs_to :hashtag, counter_cache: :posts_count

end
