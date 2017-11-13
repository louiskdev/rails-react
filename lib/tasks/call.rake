namespace :call do

  desc "Clear call sessions"
  task :clearsession => :environment do
    CallSession.delete_all
  end

end
