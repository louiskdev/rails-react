module Widgets
  module BlogWidget
    module Common
      extend ActiveSupport::Concern

      class_methods do
        def table_name_prefix
          'blog_widget_'
        end
      end

    end
  end
end
