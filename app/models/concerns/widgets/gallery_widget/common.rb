module Widgets
  module GalleryWidget
    module Common
      extend ActiveSupport::Concern

      class_methods do
        def table_name_prefix
          'gallery_widget_'
        end
      end

    end
  end
end
