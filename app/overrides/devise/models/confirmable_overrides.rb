module Devise
  module Models
    module ConfirmableOverrides

      # Confirm a user by setting it's confirmed_at to actual time. If the user
      # is already confirmed, add an error to email field. If the user is invalid
      # add errors
      def confirm(args={})
        pending_any_confirmation do
          if confirmation_period_expired?
            self.errors.add(:email, :confirmation_period_expired,
                            period: Devise::TimeInflector.time_ago_in_words(self.class.confirm_within.ago))
            return false
          end

          self.confirmed_at = Time.now.utc

          saved = if self.class.reconfirmable && unconfirmed_email.present?
                    skip_reconfirmation!
                    self.email = unconfirmed_email
                    self.unconfirmed_email = nil

                    # We need to validate in such cases to enforce e-mail uniqueness
                    save(validate: true)
                  else
                    status = save(validate: args[:ensure_valid] == true)
                    self.errors.clear if status  # TODO: this string fixes the issue
                    status
                  end

          after_confirmation if saved
          saved
        end
      end

    end
  end
end
