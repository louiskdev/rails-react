module Api
  module V1
    class SessionsController < ApplicationController
      skip_before_action :authenticate_user_from_token!, only: :create

      def create
        if params[:provider_data].present?
          identity = Identity.find_or_initialize_by(provider: params[:provider_data][:provider], uid: params[:provider_data][:uid])
          if identity.new_record?
            user = User.find_by(email: params[:provider_data][:email])
            if user.nil?
              password = Devise.friendly_token.first(8)
              user = User.create(user_params.merge(password: password, password_confirmation: password, confirmed_at: DateTime.now))
            end
            identity.user = user
            identity.save!
          end
          @user = identity.user
          if @user.present?
            sign_in :user, @user, store: false
            render :create, status: :created
          else
            invalid_login_attempt
          end
        else
          @user = User.find_for_database_authentication(email: params[:email])
          return invalid_login_attempt unless @user

          if @user.valid_password?(params[:password])
            sign_in :user, @user, store: false
            render :create, status: :created
          else
            invalid_login_attempt
          end
        end
      end

      def destroy
        current_user.reset_access_token!
        sign_out :user
        render 'api/v1/shared/empty_response', status: :no_content
      end

      private

      def user_params
        params.require(:user).permit(:email, :first_name, :avatar, :agree_to_terms)
      end

      def invalid_login_attempt
        warden.custom_failure!
        render 'api/v1/shared/failure', locals: {errors: [{ 'login or password' => ["is invalid"]}]}, status: :ok
      end

    end
  end
end