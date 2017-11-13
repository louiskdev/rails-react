ActivityType = GraphQL::ObjectType.define do
  name "Activity"
  description "Activity entry"

  interfaces [GraphQL::Relay::Node.interface,
              HasAuthorInterface    # has author
  ]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID,  "Activity ID"
  field :name, types.String, "Name of this activity"
  field :object_type, types.String, "Wrapped object type"
  field :object_id, types.Int, "Wrapped object ID"
  field :bubble_id, types.Int, "Associated bubble ID"
  field :feed, types.Boolean, "This activity is used / unused in feeds"
  field :privacy, types.String, "Privacy of this activity" do
    resolve -> (activity, args, ctx) { activity.p_private? ? 'private' : 'public' }
  end
  field :created_at, types.String, "The latest modification date of this activity"
  field :user_friendly_name, types.String, "User-friendly name of this activity"
  field :original_user_id, types.String, "Original user id of the activity when shared"

  field :bubble, BubbleType, "Associated bubble entity" do
    resolve -> (activity, args, ctx) { Bubble.find_by(id: activity.bubble_id) }
  end

  field :object, ActivityObjectUnion, "Wrapped object entity" do
    resolve -> (activity, args, ctx) { activity.object }
  end

  field :originalAuthor, -> { UserType }, "Original author entry" do
    resolve -> (activity, args, ctx) {
      original_author = User.where(id: activity.original_user_id).first
      original_author.blank? ? nil : original_author
    }
  end

  field :shared, types.Boolean, "Flag showing that this activity is a repost"

  connection :multi_preview_media, -> { MediumType.connection_type } do
    resolve -> (activity, args, ctx) do
      res = if activity.extra_data.present? && activity.extra_data['media_ids'].present?
              ids = activity.extra_data['media_ids']
              ids = JSON.parse(ids) if ids.is_a?(String)
              Medium.where(id: ids)
            else
              []
            end
       res
    end
  end

  field :multi_preview_media_count, types.Int do
    resolve -> (activity, args, ctx) do
      # HACK update media_count if needed
      # mc ==> media_count
      if activity.extra_data.present?
        mc = activity.extra_data['media_count'].to_i rescue 0
        if mc > 0
          media_set = Medium.where(id: JSON.parse(activity.extra_data['media_ids']))
          current_mc = media_set.count
          if current_mc != mc
            current_ids = media_set.ids
            activity.extra_data['media_ids'] = current_ids
            activity.extra_data['media_count'] = current_ids.size
            activity.save(validate: false)
          end
        end
      end

      activity.extra_data['media_count'].to_i rescue 0
    end
  end

  # TODO: HACK fields
  field :o_note, -> { NoteType }, 'Associated Note entity (TEMP HACK FIELD)' do
    resolve -> (activity, args, ctx) { activity.object_type == 'Note' ? activity.object : nil }
  end
  field :o_post, -> { Widgets::BlogWidget::PostType }, 'Associated Post entity (TEMP HACK FIELD)' do
    resolve -> (activity, args, ctx) { activity.object_type == 'Widgets::BlogWidget::Post' ? activity.object : nil }
  end
  field :o_bubble, -> { BubbleType }, 'Associated Bubble entity (TEMP HACK FIELD)' do
    resolve -> (activity, args, ctx) { activity.object_type == 'Bubble' ? activity.object : nil }
  end
  field :o_medium, -> { MediumType }, 'Associated Media entity (TEMP HACK FIELD)' do
    resolve -> (activity, args, ctx) { activity.object_type == 'Medium' ? activity.object : nil }
  end
  field :o_album, -> { AlbumType }, 'Associated Album entity (TEMP HACK FIELD)' do
    resolve -> (activity, args, ctx) { activity.object_type == 'Album' ? activity.object : nil }
  end
  field :o_event, -> { EventType }, 'Associated Event entity (TEMP HACK FIELD)' do
    resolve -> (activity, args, ctx) { activity.object_type == 'Event' ? activity.object : nil }
  end

end
