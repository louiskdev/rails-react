Media::ShareMediumMutation = GraphQL::Relay::Mutation.define do
  self.extend(ErrorsHelper)

  # Used to name derived types:
  name "shareMedium"
  description I18n.t('graphql.mutations.shareMedium.description')

  # Accessible from `input` in the resolve function:
  input_field :id, !types.Int, I18n.t('graphql.mutations.shareMedium.args.id')

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

      # TODO check permissions
      activity = user.activities.build(name: 'media.share',
                                       user_ip: user.current_sign_in_ip,
                                       feed: true,
                                       privacy: :p_private,
                                       object_id: media.id,
                                       object_type: media.class.name,
                                       shared: true,
                                       original_user_id: media.user_id)
      if activity.save
        {status: true}
      else
        return_errors(activity, ctx)
      end
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
