field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "galleryWidgetAlbums"
  type AlbumType.connection_type
  description I18n.t('graphql.queries.galleryWidgetAlbums.description')

  argument :bubble_id, !types.Int, I18n.t('graphql.queries.galleryWidgetAlbums.args.bubble_id')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      bubble = Bubble.find_by(id: args[:bubble_id])
      return custom_error('Bubble not found', ctx) if bubble.nil?
      gallery = bubble.gallery_widget
      return custom_error('Bubble has no gallery widget', ctx) if gallery.nil?

      if bubble.privy? and !user.is_member_of?(bubble)
        return custom_error('Access denied', ctx)
      else
        # UNREAD MEDIA FEATURE
        attendance_attrs = {url: "/bubbles/#{bubble.permalink}", section: "bubble_gallery"}
        attendance = user.attendances.find_by(attendance_attrs)

        if attendance.nil?
          user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now))
        else
          attendance.update(latest_date: DateTime.now)
        end
        # UNREAD MEDIA FEATURE
        
        albums = gallery.albums.order(updated_at: :desc)
        user.notify_unread_items_count_changed(bubble)

        albums
      end

    end
  end

  def result_if_error_occurred
    []
  end

end

Albums::GalleryWidgetAlbumsField = GraphQL::Relay::ConnectionField.create(field)
