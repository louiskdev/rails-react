class OnlineTime < ActiveRecord::Base

  def self.addRecord(session_time)
    record = OnlineTime.first
    if record.present?
      record.average_session_time = (record.average_session_time * record.session_count + session_time) / (record.session_count + 1)
      record.session_count = record.session_count + 1
      record.save
    else
      record = OnlineTime.create()
      record.average_session_time = session_time
      record.session_count = 1
      record.save
    end
  end

end
