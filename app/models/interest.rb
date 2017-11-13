class Interest < ActiveRecord::Base

  has_many :user_interests, dependent: :destroy
  has_many :users, through: :user_interests
  has_many :bubble_interests, dependent: :destroy
  has_many :bubbles, through: :bubble_interests

  validates :name,
            presence: true,
            uniqueness: true

  after_initialize :prepare_name, if: -> { self.new_record? }
  before_save :prepare_name, if: -> { self.name_changed? }
  after_create :add_new_suggestions
  #after_destroy :remove_unused_suggestions  TODO: will be a background job

  private

  def prepare_name
    self.name.strip!
    self.name.downcase!
  end

  def add_new_suggestions
    Suggestion.create(keyword: self.name)
    words = self.name.split(' ')
    unless words.size == 1
      words.each do |word|
        Suggestion.create(keyword: word)
      end
    end
  end

end
