Users::SetUserDetailsMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "setUserDetails"
  description 'set new user details (Registration step #2)'

  # Accessible from `input` in the resolve function:
  input_field :confirmation_token, !types.String
  input_field :username, !types.String
  input_field :first_name, !types.String
  input_field :gender, !types.String
  input_field :language, !types.String
  input_field :birthday, !types.String
  input_field :zip_code, !types.String
  input_field :avatar_filename, types.String
  input_field :avatar, types.String
  input_field :interests, types[types.String]

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :user, UserType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = User.find_by(confirmation_token: inputs[:confirmation_token])
    if user.nil?
      add_custom_error('Confirmation token is invalid', ctx)
    elsif user.completed?
      add_custom_error('Confirmation token is already used', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      user.confirm unless user.confirmed?
      user.assign_attributes(user_params(normalized_inputs))
      user.apply_interests(normalized_inputs[:interests]) unless normalized_inputs[:interests].blank?
      user.avatars.destroy_all
      user.apply_avatar(normalized_inputs[:avatar], normalized_inputs[:avatar_filename]) unless normalized_inputs[:avatar].blank?
      # generate `client_id` and pass it into context
      _, client_id = user.reset_access_token!
      user.current_client_id = client_id
      if user.save
        ctx[:current_user] = user

        {user: user}
      else
        return_errors(user, ctx)
      end
    end
  }

  def user_params(inputs)
    password = Devise.friendly_token.first(8)
    { username: inputs[:username],
      first_name: inputs[:first_name],
      gender: inputs[:gender],
      language: inputs[:language],
      birthday: inputs[:birthday],
      zip_code: inputs[:zip_code],
      agree_to_terms: '1',
      password: password,
      password_confirmation: password }
  end

  def result_if_error_occurred
    {user: nil}
  end

end
