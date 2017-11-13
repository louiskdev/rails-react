module HashtagProcessing
  extend ActiveSupport::Concern

  included do

    def process_hashtags(activity_id)
      text = self.mentioning_text
      return if text.nil?
      hashtags = []
      results = text.scan(/#[a-zA-Z0-9\_]+/)
      results.each do |result|
        hashtag_name = result[1..-1]
        hashtags << hashtag_name
        hashtag = Hashtag.where(name: hashtag_name).first
        if hashtag
          if hashtag.hashtag_activities.where(activity_id: activity_id).count == 0
            new_hashtag_activity = hashtag.hashtag_activities.build(activity_id: activity_id)
            new_hashtag_activity.save
            new_hashtag_post = hashtag.hashtag_posts.build(post_id: self.id)
            new_hashtag_post.save
          end
        else
          new_hashtag = Hashtag.new(name: hashtag_name)
          new_hashtag.save
          new_hashtag_activity = HashtagActivity.new(hashtag_id: new_hashtag.id, activity_id: activity_id)
          new_hashtag_activity.save
          new_hashtag_post = HashtagPost.new(hashtag_id: new_hashtag.id, post_id: self.id)
          new_hashtag_post.save
        end
      end
      hashtags
    end

  end

end
