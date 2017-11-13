namespace :ignorings do

  desc "This task sets locations of ignorings to my_feed if empty"
  task :fix_location => :environment do
    Ignoring.find_in_batches do |ignorings|
      ignorings.each do |ignoring|
        if ignoring.location.blank?
          ignoring.location = 'my_feed'
          ignoring.save(validate: false)
        end
      end
    end
  end

end
