Admin::ChangePermissionMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "changePermission"
  description I18n.t('graphql.mutations.changePermission.description')

  # Accessible from `input` in the resolve function:
  input_field :username, !types.String, I18n.t('graphql.mutations.changePermission.args.username')
  input_field :admin, !types.Int, I18n.t('graphql.mutations.changePermission.args.admin')

  # resolve must return a hash with these keys
  return_field :status, types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    current_user = ctx[:current_user]
    if current_user.blank?
      return custom_error('User is unauthorized', ctx)
    elsif current_user.admin == 0
      return custom_error('User is unauthorized', ctx)
    elsif current_user.username == inputs[:username]
      return custom_error('User cannot edit himself/herself', ctx)
    else
      user = User.where(username: inputs[:username]).first
      if user.blank?
        return custom_error('Invalid username', ctx)
      end
      admin = if inputs[:admin] > 0 then 1 else 0 end
      if User.where(id: user.id).update_all(:admin => admin)
        { status: true }
      else
        return custom_error('Failed to update user data', ctx)
      end
    end
  end

  def result_if_error_occurred
    { status: false }
  end

end
