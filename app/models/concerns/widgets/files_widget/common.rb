module Widgets
  module FilesWidget
    module Common
      extend ActiveSupport::Concern

      class_methods do
        def table_name_prefix
          'files_widget_'
        end
      end

    end
  end
end
