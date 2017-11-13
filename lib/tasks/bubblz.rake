namespace :bubblz do
  namespace :avatars do
    desc "This task re-create size versions for user/bubble avatars"
    task :recreate_versions => :environment do
      Avatar.find_each do |avatar|
        avatar.picture.recreate_versions! if avatar.picture.present?
      end
    end
  end

  namespace :media do
    desc "This task re-create size versions for media"
    task :recreate_versions => :environment do
      puts ''
      Medium.where(attachmentable_type: 'Attachments::Picture').find_in_batches(batch_size: 10) do |media|
        media.each do |m|
          print '.'
          m.attachmentable.file.recreate_versions! rescue nil
        end
      end
    end
  end

  namespace :bubbles do
    desc 'This task drops all bubbles'
    task :drop_all => :environment do
      Bubble.destroy_all
    end
  end

  desc "This task removes bubbles.join_user / disjoin_user from bubble member feed"
  task :fix1 => :environment do
    Activity.where(name: ['bubbles.join_user', 'bubbles.disjoin_user']).find_each do |activity|
      activity.update_attributes(feed: true, privacy: Activity.privacies[:p_private])
    end
  end

  desc "This task fixes old notifications"
  task :fix2 => :environment do
    Notification.find_in_batches do |notifs|
      notifs.each do |n|
        if n.extra_data.present? and n.extra_data['bubble_id'].present?
          bubble = Bubble.find_by(id: n.extra_data['bubble_id'].to_i)
          if bubble.present? and n.object.blank?
            n.object = bubble
            n.save(validate: false)
          end
        end
      end
    end
  end

  desc "This task fixes usernames"
  task :fix3 => :environment do
    User.find_in_batches do |users|
      users.each do |user|
        user.update_column(:username, user.username.downcase.strip) unless user.username.blank?
      end
    end

    BubbleInvitation.where.not(status: BubbleInvitation.statuses[:pending]).all.each do |bi|
      if bi.notification_id.present?
        if bi.notification.present?
          bi.notification.destroy
        else
          bi.update(notification_id: nil)
        end
      end

    end
  end

  desc "Creates #default channel for every chat widget and put all messages into it"
  task :chat_default_channels => :environment do
    Bubble.find_in_batches do |bubbles|
      bubbles.each do |bubble|
        chat_widget = bubble.chat_widget
        if chat_widget != nil 
          general_channel = chat_widget.channels.where(name: 'general').first
          old_default_channel = chat_widget.channels.where(name: 'default').first
          if general_channel.nil? and old_default_channel.present?
            old_default_channel.name = 'general'
            old_default_channel.save
          elsif chat_widget.channels.length == 0
            default_channel = chat_widget.create_default_channel(bubble.members[0].id)
            chat_widget.messages.update_all(channel_id: default_channel.id)
          end
        end
      end
    end
  end

end
