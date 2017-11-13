class BubbleInvitation < ActiveRecord::Base
  enum status: [:pending, :approved, :declined]
  enum originator: [:new_member, :moderator]

  belongs_to :bubble
  belongs_to :moderator, class_name: 'User', foreign_key: :moderator_id
  belongs_to :new_member, class_name: 'User', foreign_key: :new_member_id
  belongs_to :notification, dependent: :destroy

  validates :bubble_id, presence: true
  # validates :new_member_id, presence: true
  validates :status, presence: true
  validates :token,
            presence: true,
            uniqueness: true

  after_initialize :ensure_token
  after_create :create_receiver
  after_create :ensure_notification
  after_update :update_similar_invitations, if: -> (invitation) { invitation.status_changed? and !invitation.pending? }
  after_update :notify_moderator, if: -> (invitation) { invitation.status_changed? }

  private
  def ensure_token
    self.token = loop do
      new_token = Devise.friendly_token
      break new_token unless BubbleInvitation.where(token: new_token).first
    end if self.token.blank?
  end

  def create_receiver
    if self.new_member_email.present?
      user = User.find_by(email: self.new_member_email)
      if user.nil?
        passwd = Devise.friendly_token.first(8)
        user = User.new(email: self.new_member_email,
                        password: passwd,
                        password_confirmation: passwd)
        user.skip_confirmation_notification!
        user.save(validate: false)
        user.confirm
      end
    end
  end

  def ensure_notification
    if self.new_member_id.present?
      if self.moderator_id.present?
        if self.pending?
          notif = self.create_notification( user_id: self.new_member_id, initiator_type: 'User', initiator_id: self.moderator_id,
                                            name: 'invitation:new_member', object_type: 'Bubble', object_id: self.bubble_id,
                                            extra_data: { new_member_token: self.token})
          self.update_column(:notification_id, notif.id) if notif.persisted?
        end
      end
    end
  end

  def update_similar_invitations
    # rm notification if exists
    if self.notification.present?
      notif = self.notification
      notif.destroy
      self.update_column(:notification_id, nil) if notif.destroyed?
    end

    old_status = self.changes[:status][0]
    new_status = self.changes[:status][1]
    BubbleInvitation.where(bubble_id: self.bubble_id, new_member_id: self.new_member_id, status: old_status).all.each do |pbi|
      pbi.update_column(:status, BubbleInvitation.statuses[new_status])

      if pbi.notification.present?
        notif = pbi.notification
        notif.destroy
        pbi.update_column(:notification_id, nil) if notif.destroyed?
      end
    end
  end

  def notify_moderator
    data = case self.changes[:status][1]
             when 'approved' then {name: "invitation:accepted"}
             when 'declined' then {name: "invitation:declined"}
             else
               nil
           end

    new_member_id = self.new_member_id || User.find_by(email: self.new_member_email).try(:id)
    Notification.create(data.merge(user_id: self.moderator_id,
                                   initiator_type: 'User',
                                   initiator_id: new_member_id,
                                   object_type: 'Bubble',
                                   object_id: self.bubble_id,
                                   extra_data: {
                                      bubble_id: self.bubble_id,
                                      bubble_avatar: self.bubble.avatar_url
                                   })) unless data.nil?
  end

end
