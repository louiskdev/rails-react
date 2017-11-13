class ActiveUser < ActiveRecord::Base

  def self.add_count()
    today = Time.now #.strftime("%Y-%m-%d")
    record = ActiveUser.where('date = :date', date: today).first
    if record.present?
      record.count = record.count + 1
      record.save
    else
      newRecord = ActiveUser.create()
      newRecord.count = 1
      newRecord.date = today
      newRecord.save
    end
  end

end
