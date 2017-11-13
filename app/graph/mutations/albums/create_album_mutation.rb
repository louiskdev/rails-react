Albums::CreateAlbumMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createAlbum"
  description I18n.t('graphql.mutations.createAlbum.description')

  # Accessible from `input` in the resolve function:
  input_field :name, !types.String, I18n.t('graphql.mutations.createAlbum.args.name')
  input_field :privacy, !types.String, I18n.t('graphql.mutations.createAlbum.args.privacy')
  input_field :description, types.String, I18n.t('graphql.mutations.createAlbum.args.description')
  input_field :bubble_id, types.Int, I18n.t('graphql.mutations.createAlbum.args.bubble_id')

  # resolve must return a hash with these keys
  return_field :album, AlbumType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      album = user.albums.build(album_params(normalized_inputs))

      if normalized_inputs[:bubble_id].present?
        bubble = Bubble.find_by(id: normalized_inputs[:bubble_id])
        return custom_error('Bubble not found', ctx) if bubble.nil?
        return custom_error('Associated gallery widget not found', ctx) if bubble.gallery_widget.nil?
        return custom_error('Access denied', ctx) unless user.is_member_of?(bubble)
        album.gallery_id = bubble.gallery_widget.id
      else
        # UserGallery album
        return custom_error('UserGallery album cannot be public', ctx) unless album.p_private?
      end

      if album.save
        {album: album}
      else
        return_errors(album, ctx)
      end
    end
  end

  def album_params(params)
    {
        name: params[:name],
        privacy: "p_#{params[:privacy]}",
        description: params[:description]
    }
  end

  def result_if_error_occurred
    {album: nil}
  end

end
