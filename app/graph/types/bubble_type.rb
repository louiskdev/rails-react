BubbleType = GraphQL::ObjectType.define do
  name "Bubble"
  description "Bubble entry"

  interfaces [GraphQL::Relay::Node.interface,
              HasAvatarInterface,
              HasInterestsInterface,
              LikeableInterface
  ]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Bubble ID"
  field :name, !types.String, "Name of this bubble"
  field :description, types.String, "Description of this bubble"
  field :zip_code, !types.String, "Zip code of this bubble"
  field :permalink, !types.String, "Bubble ID used in the url"
  field :kind, !types.String, "Type of this bubble ('common' if public, 'privy' if private, 'global')"
  field :type, !types.String, "Alias for 'kind' field", property: :kind
  field :created_at, !types.String, "Creation date of this bubble"
  field :updated_at, !types.String, "The latest modification date of this bubble"

  field :members_count, !types.Int, "Number of members"
  field :cover_image_url, types.String, "Cover image url"
  field :user_role, types.String, "Current user's role in this bubble" do
    resolve -> (bubble, args, ctx) {
      user = ctx[:current_user]
      user.present? ? bubble.bubble_members.where(user_id: user.id).first.try(:user_role) : nil
    }
  end
  field :blog_widget_id, types.Int, "Id of the blog widget of this bubble" do
    resolve -> (bubble, args, ctx) {
      bubble.blog_widget.try(:id)
    }
  end
  field :chat_widget_id, types.Int, "Chat widget ID of this bubble" do
    resolve -> (bubble, args, ctx) {
      bubble.chat_widget.try(:id)
    }
  end
  field :gallery_widget_id, types.Int, "Gallery widget ID of this bubble" do
    resolve -> (bubble, args, ctx) {
      bubble.gallery_widget.try(:id)
    }
  end
  field :events_widget_id, types.Int, "Events widget ID of this bubble" do
    resolve -> (bubble, args, ctx) {
      bubble.events_widget.try(:id)
    }
  end
  field :files_widget_id, types.Int, "Files widget ID of this bubble" do
    resolve -> (bubble, args, ctx) {
      bubble.files_widget.try(:id)
    }
  end

  field :total_unread_items_count, types.Int, "Number of current bubble records unread by current user" do
    resolve -> (bubble, args, ctx) do
      bubble.total_unread_items_count_by_user(ctx[:current_user])
    end
  end

  connection :members, -> { UserType.connection_type }, 'Bubble members list.' do
    argument :keyword, types.String, 'Allows filtering result according to passed pattern.'
    resolve -> (bubble, args, ctx) do
      ctx[:bubble] = bubble
      members = if args[:keyword].present?
                  bubble.members.where("username ILIKE :pattern OR first_name ILIKE :pattern", pattern: "%#{args[:keyword]}%")
                else
                  bubble.members
                end
      members
    end
  end

  connection :banned_users, -> { UserType.connection_type }, 'List of users banned from the bubble.' do
    argument :keyword, types.String, 'Allows filtering result according to passed pattern.'
    resolve -> (bubble, args, ctx) do
      ctx[:bubble] = bubble
      members = if args[:keyword].present?
                  bubble.blocked_users.where("username ILIKE :pattern OR first_name ILIKE :pattern", pattern: "%#{args[:keyword]}%")
                else
                  bubble.blocked_users
                end
      members
    end
  end

end
