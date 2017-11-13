Media::DestroyMediumMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "destroyMedium"
  description I18n.t('graphql.mutations.destroyMedium.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.destroyMedium.args.id')

  # The result has access to these fields,
  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      media = Medium.find_by(id: inputs[:id])
      return custom_error('Media file not found', ctx) if media.nil?

      if user == media.uploader || user.can_manage?(media.try(:mediable).try(:bubble))
        media.actor = user
        media.destroy
        status = media.destroyed?
        {status: status}
      else
        add_custom_error('Access denied', ctx)
      end
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
