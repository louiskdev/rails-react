field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'mediaFromGallery'
  type Connections::MediaWithAlbumAndBubbleConnectionType
  description I18n.t('graphql.queries.mediaFromGallery.description')

  argument :gallery_id, !types.Int, I18n.t('graphql.queries.mediaFromGallery.args.gallery_id')
  argument :album_id, types.Int, I18n.t('graphql.queries.mediaFromGallery.args.album_id')
  argument :only_my_media, types.Boolean, I18n.t('graphql.queries.mediaFromGallery.args.only_my_media')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      gallery = Widgets::GalleryWidget::Gallery.find_by(id: args[:gallery_id])
      return custom_error('Gallery not found', ctx) if gallery.nil?

      bubble = gallery.bubble
      return custom_error('Access denied', ctx) unless user.is_member_of?(bubble)
      ctx[:bubble_id] = bubble.id

      normalized_args = normalize_input_data(args)
      media = gallery.media.newest
      if normalized_args[:album_id].present?
        album = Album.find_by(id: normalized_args[:album_id])
        if album.nil?
          add_custom_error('Album not found', ctx)
        else
          media = media.where(album_id: normalized_args[:album_id])
          album.visits.create(user: user)
          ctx[:album_id] = normalized_args[:album_id]
        end
      end

      if normalized_args[:only_my_media]
        media = media.where(user_id: user.id)
      end

      # UNREAD MEDIA FEATURE
      attendance_attrs = {url: "/bubbles/#{bubble.permalink}", section: "bubble_gallery"}
      attendance = user.attendances.find_by(attendance_attrs)

      if attendance.nil?
        user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now))
      else
        attendance.update(latest_date: DateTime.now)
      end
      # UNREAD MEDIA FEATURE

      # TODO mark records as viewed
      limit = normalized_args[:first] || normalized_args[:last] || 0
      current_media = media.limit(limit)
      current_media.each do |medium|
        medium.visits.create(user: user) rescue nil
      end

      # send realtime notification
      user.notify_unread_items_count_changed(bubble)

      media
    end
  end

  def result_if_error_occurred
    []
  end

end

Widgets::Gallery::MediaFromGalleryField = GraphQL::Relay::ConnectionField.create(field)
