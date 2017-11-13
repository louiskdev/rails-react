# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

# Interests Seeding
Interest.destroy_all
text = File.open(Rails.root.join('db', 'interests.txt')).read
text.gsub!(/\r\n?/, "\n")
text.each_line do |line|
  interest = line.delete!("\n")
  Interest.create!(name: interest.downcase)
end

#popular interests
# Interest.limit(5).each do |interest|
#   interest.update_attribute(:counter, 7)
# end
