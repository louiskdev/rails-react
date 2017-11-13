class Avatar < ActiveRecord::Base
  include ImageProcessing

  enum kind: [:common, :privy]
  attr_accessor :user_id

  mount_uploader :picture, AvatarUploader
  belongs_to :avatarable, polymorphic: true

  after_create :send_new_avatar_notification, if: Proc.new { self.avatarable_type == 'Bubble' }

  def add_picture(encoded_string, file_name='')
    tmp_file = decode_attachment(encoded_string, file_name)
    if tmp_file
      if File.extname(tmp_file).downcase == '.gif' and self.crop_params.present?
        system "convert #{tmp_file} -coalesce -repage 0x0 -rotate #{self.rotation_angle} -crop #{self.crop_params} +repage #{tmp_file}"
      end
      # save curriervawe attachment for temp file
      File.open(tmp_file) do |f|
        self.picture = f
      end
      # delete temp file
      File.delete(tmp_file)
    end

    self.picture.present?
  end

  private
  def send_new_avatar_notification
    bubble = Bubble.find_by(id: self.avatarable_id)
    return if bubble.just_created

    user = User.find_by(id: self.user_id)
    privacy = bubble.privy? ? Activity.privacies[:p_private] : Activity.privacies[:p_public]
    Activity.create(name: "bubbles.upload_avatar", user_id: user.try(:id), user_ip: user.try(:current_sign_in_ip),
                    object_id: bubble.id, object_type: bubble.class.name, bubble_id: bubble.id, feed: true, privacy: privacy)

    # real-time notification
    # Pusher.trigger("private-bubble-#{bubble.permalink}", 'bubble_avatar_changed', bubble_data: { id: bubble.id, permalink: bubble.permalink, thumb_avatar_url: bubble.avatar_url(:thumb) })
    ws_msg = {
      adapter: 'pusher',
      channel: "private-bubble-#{bubble.permalink}",
      event: 'bubble_avatar_changed',
      data: {
          bubble_data: {
              id: bubble.id,
              permalink: bubble.permalink,
              thumb_avatar_url: bubble.avatar_url(:thumb),
        }
      },
      debug_info: {
          location: 'Avatar#send_new_avatar_notification',
          avatar_id: self.id,
          avatarable_type: self.avatarable_type,
          avatarable_id: self.avatarable_id,
          user_id: user.id
      }
    }
    RealTimeNotificationJob.perform_later(ws_msg)
  end

end
