namespace :admin do

  desc "Makes some users as admin"
  task :default => :environment do
    User.where(username: 'dimi').update_all(:admin => 1)
    User.where(username: 'stefan').update_all(:admin => 1)
  end

end
