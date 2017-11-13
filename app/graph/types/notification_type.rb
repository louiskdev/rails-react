NotificationType = GraphQL::ObjectType.define do
  name "Notification"
  description I18n.t('graphql.notification_type.type_description')

  interfaces [GraphQL::Relay::Node.interface]
  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, I18n.t('graphql.notification_type.id')
  field :text, types.String, I18n.t('graphql.notification_type.text'), property: :user_friendly_name
  field :created_at, types.String, I18n.t('graphql.notification_type.created_at')
  field :code, types.Int, I18n.t('graphql.notification_type.code')
  field :initiator, -> { UserType }, I18n.t('graphql.notification_type.initiator')
  field :object_id, types.Int, I18n.t('graphql.notification_type.object_id')
  field :object_type, types.String, I18n.t('graphql.notification_type.object_type')
  field :activity_id, types.Int, I18n.t('graphql.notification_type.activity_id') do
    resolve -> (notif, args, ctx) do
      case notif.object_type
        when 'Activity' then notif.object_id
        when 'Comment' then notif.object.commentable.activities.where(feed: true).last.id rescue nil
        when 'Note' then notif.object.activities.where(name: 'notes.create').last.id rescue nil
        else
          nil
      end
    end
  end
  field :medium_id, types.Int, I18n.t('graphql.notification_type.medium_id') do
    resolve -> (notif, args, ctx) {
      case notif.object_type
        when 'Medium' then notif.object_id
        when 'Comment' then notif.object.try(:commentable_type) == 'Medium' ? notif.object.commentable_id : nil
        else
          nil
      end
    }
  end
  field :comment_id, types.Int, I18n.t('graphql.notification_type.comment_id') do
    resolve -> (notif, args, ctx) { notif.object_type == 'Comment' ? notif.object_id : nil }
  end
  field :comment, -> { CommentType }, I18n.t('graphql.notification_type.comment') do
    resolve -> (notif, args, ctx) { notif.object_type == 'Comment' and notif.object_id.present? ? notif.object : nil }
  end
  field :rating, types.Int, I18n.t('graphql.notification_type.rating') do
    resolve -> (notif, args, ctx) { notif.extra_data['rating'].to_i rescue nil }
  end
  field :bubble_id, types.Int, I18n.t('graphql.notification_type.bubble_id') do
    resolve -> (notif, args, ctx) do
      bubble_id = case notif.object_type
                 when 'Bubble' then notif.object_id
                 when 'Activity' then notif.object_id.present? ? notif.object.try(:bubble_id) : nil
                 else
                   nil
               end
      bubble_id
    end
  end
  field :bubble, -> { BubbleType }, I18n.t('graphql.notification_type.bubble') do
    resolve -> (notif, args, ctx) do
      bubble = case notif.object_type
                 when 'Bubble' then notif.object_id.present? ? notif.object : nil
                 when 'Activity' then notif.object_id.present? ? Bubble.find_by(id: notif.object.try(:bubble_id)) : nil
                 else
                   nil
               end
      bubble
    end
  end
  field :event, -> { EventType }, I18n.t('graphql.notification_type.event') do
    resolve -> (notif, args, ctx) do
      bubble = case notif.object_type
                 when 'Event' then notif.object_id.present? ? notif.object : nil
               else
                 nil
               end
      bubble
    end
  end
  field :read_at, types.String, I18n.t('graphql.notification_type.read_at')
  field :unread, types.Boolean, I18n.t('graphql.notification_type.unread') do
    resolve -> (notif, args, ctx) { notif.read_at.nil? }
  end
  field :new_member_token, types.String, I18n.t('graphql.notification_type.new_member_token') do
    resolve -> (notif, args, ctx) { notif.extra_data.present? ? notif.extra_data['new_member_token'] : nil }
  end

  # TODO: HACK fields
  # field :o_activity, -> { ActivityType }, 'Associated Activity entity (TEMP HACK FIELD)' do
  #   resolve -> (notif, args, ctx) { notif.object_type == 'Activity' ? notif.object : nil }
  # end
end
