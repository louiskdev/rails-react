Connections::MediaWithAlbumAndBubbleConnectionType = MediumType.define_connection do
  name 'MediaWithAlbumAndBubbleConnection'

  field :album, -> { AlbumType } do
    description 'Album owning media files'
    resolve -> (connection, args, ctx) do
      media = connection.nodes.first
      if media.nil?
        Album.find_by(id: ctx[:album_id])
      else
        media.try(:album)
      end
    end
  end

  field :bubble, -> { BubbleType } do
    description 'Bubble owning media files'
    resolve -> (connection, args, ctx) do
      media = connection.nodes.first
      if media.nil?
        Bubble.find_by(id: ctx[:bubble_id])
      else
        media.try(:gallery).try(:bubble)
      end
    end
  end

  field :unviewed_media_count, types.Int do
    description "Number of media files that the current user hasn't viewed yet"
    resolve -> (connection, args, ctx) {
      last_attendance_date = ctx[:current_user].attendances.find_by(url: '/dashboard', section: "gallery").latest_date rescue DateTime.ordinal(0)
      ctx[:current_user].media.available_in_user_gallery.where('created_at > ?', last_attendance_date).count
    }
  end
end
