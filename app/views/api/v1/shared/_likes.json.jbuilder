json.likes_count object.likers_count
liked = object.liked_by?(current_user) rescue ''
json.liked liked