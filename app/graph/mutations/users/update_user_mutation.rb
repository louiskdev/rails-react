Users::UpdateUserMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "updateUser"
  description I18n.t('graphql.mutations.updateUser.description')

  # Accessible from `input` in the resolve function:
  input_field :username, types.String, I18n.t('graphql.mutations.updateUser.args.username')
  input_field :first_name, types.String, I18n.t('graphql.mutations.updateUser.args.first_name')
  input_field :gender, types.String, I18n.t('graphql.mutations.updateUser.args.gender')
  input_field :language, types.String, I18n.t('graphql.mutations.updateUser.args.language')
  input_field :birthday, types.String, I18n.t('graphql.mutations.updateUser.args.birthday')
  input_field :zip_code, types.String, I18n.t('graphql.mutations.updateUser.args.zip_code')
  input_field :phone, types.String, I18n.t('graphql.mutations.updateUser.args.phone')
  input_field :description, types.String, I18n.t('graphql.mutations.updateUser.args.description')
  input_field :avatar_filename, types.String, I18n.t('graphql.mutations.updateUser.args.avatar_filename')
  input_field :avatar, types.String, I18n.t('graphql.mutations.updateUser.args.avatar')
  input_field :interests, types[types.String], I18n.t('graphql.mutations.updateUser.args.interests')
  input_field :cover_image, types.String, I18n.t('graphql.mutations.updateUser.args.cover_image')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :user, UserType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    normalized_inputs = normalize_input_data(inputs)
    user.assign_attributes(user_params(normalized_inputs))

    user.apply_interests(normalized_inputs[:interests]) unless normalized_inputs[:interests].blank?
    if normalized_inputs[:avatar].present?
      user.avatars.destroy_all
      user.apply_avatar(normalized_inputs[:avatar], normalized_inputs[:avatar_filename])
    end
    user.apply_cover_image(normalized_inputs[:cover_image])

    if user.save
      notify!(user)
      {user: user}
    else
      return_errors(user, ctx)
    end
  end

  def user_params(inputs)
    { username: inputs[:username],
      first_name: inputs[:first_name],
      gender: inputs[:gender],
      language: inputs[:language],
      birthday: inputs[:birthday],
      phone: inputs[:phone],
      description: inputs[:description],
      zip_code: inputs[:zip_code],
      agree_to_terms: '1'}
  end

  def notify!(current_user)
    ws_msg = {
        adapter: 'pusher',
        event: 'user_info_updated',
        data: {
            message: 'info_updated',
            user_id: current_user.id,
        },
        debug_info: {
            location: 'Users::UpdateUserMutation#notify!',
            user_id: current_user.id,
        }
    }

    channels = ["private-user-#{current_user.id}", "profile-page-#{current_user.id}"]
    current_user.friends.online_users.each { |friend| channels << "private-user-#{friend.id}" }
    ws_msg[:channel] = channels
    RealTimeNotificationJob.perform_later(ws_msg)
  end

  def result_if_error_occurred
    {user: nil}
  end

end
