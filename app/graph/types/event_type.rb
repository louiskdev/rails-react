EventType = GraphQL::ObjectType.define do
  name "Event"
  description "Event entry"

  interfaces [GraphQL::Relay::Node.interface,
              HasAvatarInterface,
              LikeableInterface
  ]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Event ID"
  field :name, !types.String, "Name of this event"
  field :permalink, !types.String, "Event ID used in the url"
  field :kind, types.String, "Type of this event"
  field :type, types.String, "Alias for 'kind' field", property: :kind
  field :owner_id, !types.String, "ID of owner user"
  field :created_at, !types.String, "Creation date of this event"
  field :updated_at, !types.String, "The latest modification date of this event"
  field :address, !types.String, "Address of this event location"
  field :description, types.String, "Description of this event"
  field :start_date, types.String, "Start date of this event"

  field :likers_count, !types.Int, "Number of likers"
  field :members_count, !types.Int, "Number of members"
  field :cover_image_url, types.String, "Cover image url"
  field :user_role, types.String, "Current user's role in this event" do
    resolve -> (event, args, ctx) {
      user = ctx[:current_user]
      user.present? ? event.event_members.where(user_id: user.id).first.try(:user_role) : nil
    }
  end

  field :joined, types.Boolean, "Joined/not joined status of current user" do
    resolve -> (event, args, ctx) {
      user = ctx[:current_user]
      user.present? ? user.is_participant_of?(event) : false
    }
  end

  field :owned, types.Boolean, "Owner status of current user" do
    resolve -> (event, args, ctx) {
      user = ctx[:current_user]
      user.present? ? user.id == event.owner_id : false
    }
  end

  connection :members, -> { UserType.connection_type }, 'Event members list.' do
    argument :keyword, types.String, 'Allows filtering result according to passed pattern.'
    resolve -> (event, args, ctx) do
      members = if args[:keyword].present?
                  event.members.where("username ILIKE :pattern OR first_name ILIKE :pattern", pattern: "%#{args[:keyword]}%")
                else
                  event.members
                end
      members
    end
  end

end
