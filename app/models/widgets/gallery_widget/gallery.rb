module Widgets
  module GalleryWidget
    class Gallery < ActiveRecord::Base
      include Common

      has_one :widget, as: :widgetable
      has_one :bubble, through: :widget
      has_many :media, as: :mediable, dependent: :destroy
      has_many :albums, dependent: :destroy

      def latest_media(count)
        media.order(created_at: :desc).limit(count)
      end
    end
  end
end
