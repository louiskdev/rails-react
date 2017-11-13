module Widgets
  module FilesWidget
    class Files < ActiveRecord::Base
      include Common

      has_one :widget, as: :widgetable
      has_one :bubble, through: :widget
      has_many :uploaded_files
    end
  end
end
