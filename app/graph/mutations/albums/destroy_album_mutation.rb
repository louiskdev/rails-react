Albums::DestroyAlbumMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyAlbum"
  description I18n.t('graphql.mutations.destroyAlbum.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.destroyAlbum.args.id')

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

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
        if album.media.empty?
          album.destroy
          {status: album.destroyed?}
        else
          add_custom_error('Cannot destroy non-empty album', ctx)
        end
      else
        add_custom_error('Access denied', ctx)
      end
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
