Albums::UpdateAlbumMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "updateAlbum"
  description I18n.t('graphql.mutations.updateAlbum.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.updateAlbum.args.id')
  input_field :name, types.String, I18n.t('graphql.mutations.updateAlbum.args.name')
  input_field :description, types.String, I18n.t('graphql.mutations.updateAlbum.args.description')

  # resolve must return a hash with these keys
  return_field :album, AlbumType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      album = Album.find_by(id: inputs[:id])
      if album.nil?
        add_custom_error('Album not found', ctx)
      elsif album.user == user or (album.gallery.present? and user.can_manage?(album.gallery.bubble))
        if album.update(normalize_input_data(inputs))
          {album: album}
        else
          return_errors(album, ctx)
        end
      else
        add_custom_error('Access denied', ctx)
      end
    end
  end

  def result_if_error_occurred
    {album: nil}
  end

end
