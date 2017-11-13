field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "userGalleryAlbums"
  type AlbumType.connection_type
  description "List of albums from user's gallery sorted by latest changes date"

  argument :username, !types.String

  resolve -> (obj, args, ctx) do
    if ctx[:current_user].nil?
      add_custom_error('User is unauthorized', ctx)
    else
      user = User.find_by(username: args[:username])
      if user.nil?
        add_custom_error('User not found', ctx)
      else
        albums = user.albums.where(gallery_id: nil).order(updated_at: :desc)
        albums
      end

    end
  end

  def result_if_error_occurred
    []
  end

end

Albums::UserGalleryAlbumsField = GraphQL::Relay::ConnectionField.create(field)
