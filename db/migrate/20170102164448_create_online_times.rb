class CreateOnlineTimes < ActiveRecord::Migration
  def change
    create_table :online_times do |t|
      t.integer :average_session_time
      t.integer :session_count
    end
  end
end
