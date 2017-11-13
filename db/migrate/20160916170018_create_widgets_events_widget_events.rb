class CreateWidgetsEventsWidgetEvents < ActiveRecord::Migration
  def change
    create_table :events_widget_events do |t|

      t.timestamps null: false
    end
  end
end
