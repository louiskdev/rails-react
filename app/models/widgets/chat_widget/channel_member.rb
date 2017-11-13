module Widgets
  module ChatWidget
    class ChannelMember < ActiveRecord::Base
      include Common

      belongs_to :channel, dependent: :destroy
      belongs_to :user, dependent: :destroy
    end
  end
end