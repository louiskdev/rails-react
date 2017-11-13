field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "myGalleryAlbums"
  type AlbumType.connection_type
  description "List of albums from current user's private gallery sorted by latest changes date"

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      albums = user.albums.where(gallery_id: nil).order(updated_at: :desc)
      albums
    end
  end

  def result_if_error_occurred
    []
  end

end

Albums::MyGalleryAlbumsField = GraphQL::Relay::ConnectionField.create(field)
