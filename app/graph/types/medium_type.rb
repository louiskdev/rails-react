MediumType = GraphQL::ObjectType.define do
  name "Medium"
  description "Media entry (picture or video wrapper)"

  interfaces [GraphQL::Relay::Node.interface,
              HasAuthorInterface,
              LikeableInterface,
              VisitableInterface,
              CommentableInterface,
              RatingableInterface
  ]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID, "Media ID"
  field :title, types.String, "Title of this media"
  field :user_id, types.Int, "Uploader ID"
  field :album_id, types.Int, "Associated album ID"
  field :attachmentable_type, types.String, "Type of attachment related to this media"
  field :attachmentable_id, types.Int, "The ID of attachment related to this media"
  field :mediable_type, types.String, "The object type associated to this media (post, chat message...)"
  field :mediable_id, types.Int, "Object ID associated to this media (post, chat message...)"
  field :created_at, types.String, "Creation date of this media"
  field :updated_at, types.String, "The latest modification date of this media"

  field :type, types.String, "Type of media ('picture' or 'video')"
  field :uploader, -> { UserType }, "Uploader entry" do
    resolve -> (medium, args, ctx) { medium.uploader }
  end

  field :picture_url, types.String, "Picture url" do
    argument :version, types.String

    resolve -> (medium, args, ctx) do
      method = medium.type == 'picture' ? :file_url : :thumbnail
      url = args[:version].blank? ? medium.attachmentable.try(method) : medium.attachmentable.try(method, args[:version])
      url
    end
  end
  field :recoding_job_id, types.String, "Zencoder job ID" do
    resolve -> (medium, args, ctx) do
      if medium.type == 'video' and medium.attachmentable.recoding_job_key.present?
        medium.attachmentable.recoding_job_key
      else
        nil
      end
    end
  end
  field :thumb_url, types.String, "Picture/video preview url" do
    resolve -> (medium, args, ctx) do
      if medium.type == 'video' and medium.attachmentable.recoding_job_key.present?
        nil
      else
        medium.try(:thumb_url)
      end
    end
  end
  field :video_links, types.String.to_list_type, "Several video format (mp4, webm, ogv) urls" do
    resolve -> (medium, args, ctx) do
      if medium.type == 'video' and medium.attachmentable.recoding_job_key.blank?
        medium.attachmentable.try(:links)
      else
        []
      end
    end
  end
  field :album, -> { AlbumType }, "Associated album entity"

  field :mediable, -> { MediumObjectUnion }, "The object which has this media" do
    resolve -> (medium, args, ctx) { medium.mediable }
  end

end
