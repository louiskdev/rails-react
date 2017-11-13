class CreateSuggestions < ActiveRecord::Migration
  def up
    create_table :suggestions do |t|
      t.string :keyword
      t.integer :freq, default: 0

      t.timestamps null: false
      t.index :keyword, unique: true
    end

    # Interest.all.pluck(:name).each do |interest_name|
    #   Suggestion.create(keyword: interest_name)
    #   words = interest_name.split(' ')
    #   unless words.size == 1
    #     words.each do |word|
    #       Suggestion.create(keyword: word)
    #     end
    #   end
    # end
    # Bubble.common_or_global.pluck(:name).each do |bubble_name|
    #   bubble_name.split(' ').each do |word|
    #     Suggestion.create(keyword: word)
    #   end
    # end
    # User.all.each do |user|
    #   if user.valid?
    #     user.first_name.split(' ').each do |word|
    #       Suggestion.create(keyword: word)
    #     end
    #   end
    # end
  end

  def down
    drop_table :suggestions
  end
end
