WheelChat::NotificationType = GraphQL::ObjectType.define do
  name "WheelChatNotification"
  description "Wheelchat (1v1 chat) notification entry"

  interfaces [GraphQL::Relay::Node.interface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Notification ID"
  field :channel_name, types.String, "Channel name of chat associated to this notification"
  field :created_at, types.String, "Creation date of this notification"
  field :updated_at, types.String, "The latest modification date of this notification"
  field :user_id, types.Int, "Receiver ID"
  field :user, UserType, "Receiver entry"
  field :initiator_id, types.Int, "Initiator ID"
  field :initiator, UserType, "The user, on behalf of who this notification was created."
end
