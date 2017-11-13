class ApiKey < ActiveRecord::Base
  belongs_to :user

  validates :access_token,
           presence: true,
           uniqueness: true
  validates :client_id,
            presence: true,
            uniqueness: { scope: :access_token }
  validates :user_id,
           presence: true,
           numericality: { only_integer: true }

end
