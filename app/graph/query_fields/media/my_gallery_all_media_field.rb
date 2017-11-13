field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "myGalleryAllMedia"
  type Connections::MediaWithAlbumAndBubbleConnectionType
  description 'Get all media files of current user available in his/her private gallery'

  argument :album_id, types.Int
  argument :bubble_id, types.Int

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      media = user.media.available_in_user_gallery.newest

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

      if normalized_args[:bubble_id].present?
        bubble = Bubble.find_by(id: normalized_args[:bubble_id])
        if bubble.nil?
          add_custom_error('Bubble not found', ctx)
        else
          gallery = bubble.gallery_widget
          if gallery.nil?
            add_custom_error("Bubble hasn't gallery widget", ctx)
          else
            media = media.where(mediable_type: 'Widgets::GalleryWidget::Gallery',mediable_id: gallery.id)
            ctx[:bubble_id] = normalized_args[:bubble_id]
          end
        end
      end

      # TODO
      # media.each do |m|
      #   m.visits.create(user: user)
      # end

      media
    end
  end

  def result_if_error_occurred
    []
  end

end

Media::MyGalleryAllMediaField = GraphQL::Relay::ConnectionField.create(field)
