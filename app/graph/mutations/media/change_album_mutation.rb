Media::ChangeAlbumMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "changeAlbum"
  description 'put medium entry into album'

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int
  input_field :album_id, !types.Int
  input_field :gallery_id, types.Int

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    return add_custom_error('User is unauthorized', ctx) if user.blank?

    normalized_inputs = normalize_input_data(inputs)
    media = Medium.available_in_user_gallery.find_by(id: normalized_inputs[:id])
    return add_custom_error('Media file not found', ctx) if media.nil?

    album = Album.find_by(id: normalized_inputs[:album_id])
    return add_custom_error('Album not found', ctx) if album.nil?

    if normalized_inputs[:gallery_id].present?
      gallery = Widgets::GalleryWidget::Gallery.find_by(id: normalized_inputs[:gallery_id])
      return add_custom_error('Gallery widget not found', ctx) if gallery.nil?
    end

    bubble = media.gallery.try(:bubble)
    if media.uploader == user or bubble.present? and user.is_member_of?(bubble)
      old_album = media.album
      media.album = album
      media.mediable = gallery if normalized_inputs[:gallery_id].present?

      if media.save
        extra_data = {title: media.title, album: {name: album.name, id: album.id, old_name: old_album.try(:name), old_id: old_album.try(:id)}}
        if bubble.present?
          extra_data.merge!(bubble: {name: bubble.name})
          privacy = bubble.privy? ? Activity.privacies[:p_friends] : Activity.privacies[:p_public]
        else
          privacy = Activity.privacies[:p_private]
        end

        Activity.create(name: 'media.put_media', user_id: user.id, user_ip: user.current_sign_in_ip,
                        object_id: media.id, object_type: media.class.name, privacy: privacy, feed: true,
                        bubble_id: bubble.try(:id), extra_data: extra_data)
      else
        return return_errors(media, ctx)
      end
    else
      return add_custom_error('Access denied', ctx)
    end

    {status: true}
  }

  def result_if_error_occurred
    {status: false}
  end

end
