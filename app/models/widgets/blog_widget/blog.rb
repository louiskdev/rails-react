module Widgets
  module BlogWidget
    class Blog < ActiveRecord::Base
      include Common

      has_one :widget, as: :widgetable
      has_one :bubble, through: :widget
      has_many :posts, class_name: '::Widgets::BlogWidget::Post', dependent: :destroy

    end
  end
end
