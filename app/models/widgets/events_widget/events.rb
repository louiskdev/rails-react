module Widgets
  module EventsWidget
    class Events < ActiveRecord::Base
      include Common

      has_one :widget, as: :widgetable
      has_one :bubble, through: :widget
      has_many :events, dependent: :destroy
    end
  end
end
