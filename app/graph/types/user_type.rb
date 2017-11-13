UserType = GraphQL::ObjectType.define do
  name "User"
  description I18n.t('graphql.user_type.type_description')

  interfaces [GraphQL::Relay::Node.interface,
              HasAvatarInterface,
              HasInterestsInterface]

  # `id` exposes the UUID
  global_id_field :id

  # Expose fields from the model
  field :id, !types.ID,  I18n.t('graphql.user_type.id')
  field :email, types.String,  I18n.t('graphql.user_type.email') do
    resolve -> (obj, args, ctx) { ctx[:current_user].present? and ctx[:current_user] == obj ? obj.email : nil }
  end
  field :username, types.String, I18n.t('graphql.user_type.username')
  field :first_name, types.String, I18n.t('graphql.user_type.first_name')
  field :gender, types.String, I18n.t('graphql.user_type.gender')
  field :zip_code, types.String, I18n.t('graphql.user_type.zip_code')
  field :phone, types.String, I18n.t('graphql.user_type.phone')
  field :birthday, types.String, I18n.t('graphql.user_type.birthday')
  field :language, types.String, I18n.t('graphql.user_type.language')
  field :description, types.String, I18n.t('graphql.user_type.description')
  field :cover_image_url, types.String, I18n.t('graphql.user_type.cover_image_url')
  field :is_online, types.Boolean, I18n.t('graphql.user_type.is_online'), property: :is_online_now?
  field :created_at, types.String,  I18n.t('graphql.user_type.created_at')
  field :updated_at, types.String,  I18n.t('graphql.user_type.updated_at')
  field :current_sign_in_ip, types.String, I18n.t('graphql.user_type.current_sign_in_ip') do
    resolve -> (user, args, ctx) { ctx[:current_user].present? and ctx[:current_user] == user ? user.current_sign_in_ip : nil }
  end
  field :access_token, types.String, I18n.t('graphql.user_type.access_token') do
    resolve -> (user, args, ctx) { ctx[:current_user].present? and ctx[:current_user] == user ? user.api_keys.find_by(client_id: user.current_client_id).try(:access_token) : nil }
  end
  field :client_id, types.String, I18n.t('graphql.user_type.client_id') do
    resolve -> (user, args, ctx) { ctx[:current_user].present? and ctx[:current_user] == user ? user.current_client_id : nil }
  end
  field :is_completed, types.Boolean, I18n.t('graphql.user_type.is_completed') do
    resolve -> (user, args, ctx) { ctx[:current_user].present? and ctx[:current_user] == user ? user.valid? : nil }
  end
  field :likes_count, types.Int, I18n.t('graphql.user_type.likes_count'), property: :likees_count
  field :pictures_count, types.Int, I18n.t('graphql.user_type.pictures_count') do
    resolve -> (user, args, ctx) {
      user.media.where(attachmentable_type: 'Attachments::Picture', mediable_type: ['Widgets::GalleryWidget::Gallery', nil]).count
    }
  end
  field :bubbles_count, types.Int, I18n.t('graphql.user_type.bubbles_count')

  connection :bubbles, -> { BubbleType.connection_type }, I18n.t('graphql.user_type.bubbles.description') do
    argument :random, types.Boolean, I18n.t('graphql.user_type.bubbles.args.random')
    argument :keyword, types.String, I18n.t('graphql.user_type.bubbles.args.keyword')

    resolve -> (user, args, ctx) do
      if user == ctx[:current_user]
        Bubbles::MyBubblesField.resolve(user, args, ctx).nodes
      else
        args_hash = args.to_h
        args_hash.merge!(username: user.username)

        new_args = GraphQL::Query::Arguments.new(args_hash, argument_definitions: Bubbles::UserBubblesField.arguments)
        Bubbles::UserBubblesField.resolve(user, new_args, ctx).nodes
      end
    end
  end

  field :friendship_status, types.String, I18n.t('graphql.user_type.friendship_status') do
    resolve -> (user, args, ctx) { user.friendships.find_by(friend_id: ctx[:current_user].id).try(:status) }
  end
  field :friends_count, types.Int, I18n.t('graphql.user_type.friends_count') do
    resolve -> (user, args, ctx) { user.friends.count }
  end

  connection :friends, -> { UserType.connection_type }, I18n.t('graphql.user_type.friends.description') do
    argument :online, types.Boolean, I18n.t('graphql.user_type.friends.args.online')
    argument :keyword, types.String, I18n.t('graphql.user_type.friends.args.keyword')
    argument :sort_by, types.String, I18n.t('graphql.user_type.friends.args.sort_by')
    argument :all, types.Boolean, I18n.t('graphql.user_type.friends.args.all')

    resolve -> (user, args, ctx) do
      if ctx[:current_user].present? and user == ctx[:current_user]
        friends = user.friends

        unless args[:online].nil?
          online_user_ids = Redis.current.smembers('bubblz:online_user_ids').map {|el| el.to_i }
          friends = args[:online] ? friends.where(id: online_user_ids) : friends.where.not(id: online_user_ids)
        end

        if args[:keyword].present?
          friends = friends.where("users.username ILIKE :text OR users.first_name ILIKE :text", text: "%#{args[:keyword]}%")
        end

        if args[:sort_by] == 'last_message_date'
          friends = friends.group('users.id').order('last_message_date DESC NULLS LAST').
              select("users.*, MAX(wheel_chat_messages.created_at) AS last_message_date, COUNT(wheel_chat_messages.id) AS messages_count").
              joins("INNER JOIN wheel_chat_messages ON (users.id = wheel_chat_messages.user_id OR users.id = wheel_chat_messages.receiver_id)").
              where("wheel_chat_messages.user_id = :id OR wheel_chat_messages.receiver_id = :id", id: user.id)

          if args[:all].present?
            user.friends.each do |friend|  # unsorted friends
              unless friends.include?(friend)
                friends = friends.to_a unless friends.is_a?(Array)
                friends << friend
              end
            end
          end
        end

        friends
      else
        []
      end
    end

  end

  connection :birthday_friends, -> { UserType.connection_type }, I18n.t('graphql.user_type.birthday_friends.description') do
    resolve -> (user, args, ctx) do
      if ctx[:current_user].present? and user == ctx[:current_user]
        user.friends.completed.nearest_birthdays(7)
      else
        []
      end
    end
  end

  connection :notifications, -> { NotificationType.connection_type }, I18n.t('graphql.user_type.notifications.description') do
    argument :status, types.String, I18n.t('graphql.user_type.notifications.args.status')

    resolve -> (user, args, ctx) do
      if ctx[:current_user].present? and ctx[:current_user] == user
        unless ['read', 'unread', '', nil].include?(args[:status])
          ctx.errors << GraphQL::ExecutionError.new('Unknown status')
          GraphQL::Language::Visitor::SKIP
          return []
        end

        notifs = case args[:status]
                   when 'unread' then user.unread_notifications
                   when 'read' then user.received_notifications.where.not(read_at: nil).order(created_at: :desc)
                   else
                     user.received_notifications.order(created_at: :desc)
                 end
        notifs
      else
        []
      end
    end
  end

  field :wheel_chat_channel_name, types.String, I18n.t('graphql.user_type.wheel_chat_channel_name') do
    resolve -> (user, args, ctx) do
      if ctx[:current_user].present? and ctx[:current_user] != user and user.friend_of?(ctx[:current_user])
        ::WheelChat::Chat.channel_name_for_users(user, ctx[:current_user])
      else
        nil
      end
    end
  end

  field :wheel_chat_last_message, -> { ::WheelChat::MessageType }, I18n.t('graphql.user_type.wheel_chat_last_message') do
    resolve -> (user, args, ctx) do
      if ctx[:current_user].present? and ctx[:current_user] != user and user.friend_of?(ctx[:current_user])
        channel_name = ::WheelChat::Chat.channel_name_for_users(user, ctx[:current_user])
        chat = ::WheelChat::Chat.find_by(channel_name: channel_name)
        chat.nil? ? nil : chat.messages.order(:created_at).last
      else
        nil
      end
    end
  end

  field :wheel_chat_missed_messages_count, types.Int, I18n.t('graphql.user_type.wheel_chat_missed_messages_count') do
    resolve -> (user, args, ctx) do
      if ctx[:current_user].present? and ctx[:current_user] != user and user.friend_of?(ctx[:current_user])
        channel_name = ::WheelChat::Chat.channel_name_for_users(user, ctx[:current_user])
        ctx[:current_user].wheel_chat_notifications.where(channel_name: channel_name).count
      else
        nil
      end
    end
  end

  field :user_role_in_bubble, types.String, I18n.t('graphql.user_type.user_role_in_bubble') do
    resolve -> (user, args, ctx) do
      if user.present? and ctx[:bubble].present? and ctx[:bubble].is_a?(Bubble)
        bubble = ctx[:bubble]
        current_user = ctx[:current_user]
        if user == current_user or current_user.can_manage?(bubble)
          return user.bubble_members.find_by(bubble_id: bubble.id).try(:user_role)
        end
      end

      nil
    end
  end

  field :user_online_in_bubble, types.Boolean, I18n.t('graphql.user_type.user_online_in_bubble') do
    resolve -> (user, args, ctx) do
      user.is_online_in_bubble?(ctx[:bubble])
    end
  end

end
