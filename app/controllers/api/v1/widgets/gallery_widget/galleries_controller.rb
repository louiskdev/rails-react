class Api::V1::Widgets::GalleryWidget::GalleriesController < ApplicationController
  before_action :find_gallery, only: [:show]

  def show
    page_number = parse_page_param
    return if page_number.nil?
    media_offset = page_number * Medium::ITEMS_PER_PAGE

    case params[:view_type]
      when 'by_me'
        @media = @gallery.media.where(user_id: current_user.id).newest.offset(media_offset).limit(Medium::ITEMS_PER_PAGE)
      when 'of_me'
        @media = []
      when 'by_albums'
        @albums = @gallery.albums
        @media_groups = @gallery.media.group_by { |el| el.album_id }
        render :show_by_albums, status: :ok and return
      else
        @media = @gallery.media.newest.offset(media_offset).limit(Medium::ITEMS_PER_PAGE)
    end

    @media.each do |media|
      media.visits.create(user: current_user)
    end
  end

  private

  def find_gallery
    @gallery = ::Widgets::GalleryWidget::Gallery.find(params[:id])
  end
end
