module Widgets
  module ChatWidget
    class Channel < ActiveRecord::Base
      include Common

      enum kind: [:global, :privy]

      belongs_to :chat
      # has_one :creator, class_name: 'User', foreign_key: :id
      has_many :messages
      has_many :channel_members, dependent: :destroy
      has_many :members, through: :channel_members, :source => :user

      def self.normalize_kind_attr(kind)
        case kind
          when 'global' then 'global'
          when 'privy', 'private' then 'privy'
          else
            'global'
        end
      end

      def display_name(current_user)
        if self.kind === 'global' or self.name.present?
          return self.name
        else
          channel_name = ''
          first = true
          self.members.each do |member|
            if member.id != current_user.id
              unless first
                channel_name += ', '
              else
                first = false
              end
              channel_name += member.username
            end
          end
          return channel_name
        end
      end

      def to_hash(current_user)
        channel = {}
        channel[:id] = self.id
        channel[:name] = self.display_name(current_user)
        channel[:kind] = self.kind
        channel[:type] = self.kind

        if self.kind == Widgets::ChatWidget::Channel.kinds[:privy]
          user = self.members.first
          channel[:user] = {}
          channel[:user][:id] = user.id
          channel[:user][:username] = user.username
          channel[:user][:avatar_url] = user.avatar_url(:thumb)
        end

        # if self.creator.nil?
        #   channel[:creator] = ''
        # else
        #   channel[:creator] = {}
        #   channel[:creator][:first_name] = self.creator.first_name
        #   channel[:creator][:username] = self.creator.username
        #   channel[:creator][:thumb_avatar_url] = self.creator.avatar_url(:thumb)
        # end

        channel
      end
    end
  end
end
