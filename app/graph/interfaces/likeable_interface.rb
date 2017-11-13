LikeableInterface = GraphQL::InterfaceType.define do
  name "LikeableInterface"
  description "The object implementing this interface can be liked"

  field :likes_count, !types.Int, "Number of likes for the object" do
    resolve -> (obj, args, ctx) { obj.likers_count }
  end
  field :liked, !types.Boolean, "This object is liked/not liked by current user" do
    resolve -> (obj, args, ctx) { ctx[:current_user].present? ? obj.liked_by?(ctx[:current_user]) : false }
  end
  connection :likers, -> { Connections::LikersConnectionType }, 'Users who liked this object' do
    argument :limit, types.Int, '', default_value: 2

    resolve -> (obj, args, ctx) do
      user = ctx[:current_user]
      limit = args[:limit]
      friends_ids = user.friends.ids
      likers_ids = Like.likers_relation(obj, User).ids
      total_likers_count = likers_ids.size
      likers = []
      count = 0

      # check current user
      if likers_ids.include?(user.id) and count < limit
        likers.push(User.find_by(id: likers_ids.delete(user.id)))
        count += 1
      end

      # check friends of current user
      ids = friends_ids & likers_ids
      while count < limit and ids.size > 0
        id = ids.sample
        ids.delete(id)
        likers_ids.delete(id)
        likers.push(User.find_by(id: id))
        count += 1
      end

      # check other users
      while count < limit and likers_ids.size > 0
        id = likers_ids.sample
        likers_ids.delete(id)
        likers.push(User.find_by(id: id))
        count += 1
      end

      ctx[:other_likers_count] = total_likers_count - count

      likers
    end
  end
end
