class Api::V1::PasswordsController < Devise::PasswordsController
  skip_before_action :authenticate_user_from_token!, only: [:create, :edit, :update]
  respond_to :json, only: :create
  respond_to :html, only: [:edit, :update]

  # PUT /resource/password
  def update
    self.resource = resource_class.reset_password_by_token(resource_params)
    yield resource if block_given?
    resource.errors.messages.delete_if { |attr, _| attr !~ /password/ }  # FIX user validations on update

    if resource.errors.empty?
      resource.unlock_access! if unlockable?(resource)
      if Devise.sign_in_after_reset_password
        flash_message = resource.active_for_authentication? ? :updated : :updated_not_active
        set_flash_message(:notice, flash_message) if is_flashing_format?
        sign_in(resource_name, resource, store: false)
        # respond_with resource, location: after_resetting_password_path_for(resource)
        redirect_to '/profile'
      else
        set_flash_message(:notice, :updated_not_active) if is_flashing_format?
        # respond_with resource, location: new_session_path(resource_name)
        redirect_to '/signin'
      end
    else
      render :edit
      # respond_with resource
    end
  end

  private

  #override before_filter method
  def assert_reset_token_passed
    if params[:reset_password_token].blank?
      set_flash_message(:alert, :no_token)
      redirect_to '/signin'
    end
  end
end
