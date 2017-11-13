module Chat
  module Base
    extend ActiveSupport::Concern

    included do
      has_many :messages, dependent: :destroy
    end

  end
end
