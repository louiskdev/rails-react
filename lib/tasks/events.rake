namespace :events do

  desc "This task fixes nulled address fields"
  task :fix_address => :environment do
    Event.find_in_batches do |events|
      events.each do |event|
        if event.address.blank?
          event.address = '350 5th Avenue, New York, US'
          event.save(validate: false)
        end
      end
    end
  end

  desc "This task removes invalid events activities which has null bubble_id"
  task :remove_invalid => :environment do
    Activity.find_in_batches do |activities|
      activities.each do |activity|
        if activity.bubble_id.blank? and activity.name == "events.create"
          activity.destroy
        end
      end
    end
  end

end
