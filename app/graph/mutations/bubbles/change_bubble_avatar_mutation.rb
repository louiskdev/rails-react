Bubbles::ChangeBubbleAvatarMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "changeBubbleAvatar"
  description I18n.t('graphql.mutations.changeBubbleAvatar.description')

  # Accessible from `input` in the resolve function:
  input_field :bubble_id, !types.Int, I18n.t('graphql.mutations.changeBubbleAvatar.args.bubble_id')
  input_field :picture_file, !types.String, I18n.t('graphql.mutations.changeBubbleAvatar.args.picture_file')
  input_field :filename, types.String, I18n.t('graphql.mutations.changeBubbleAvatar.args.filename')
  input_field :crop_x, types.Int, I18n.t('graphql.mutations.changeBubbleAvatar.args.crop_x')
  input_field :crop_y, types.Int, I18n.t('graphql.mutations.changeBubbleAvatar.args.crop_y')
  input_field :crop_h, types.Int, I18n.t('graphql.mutations.changeBubbleAvatar.args.crop_h')
  input_field :crop_w, types.Int, I18n.t('graphql.mutations.changeBubbleAvatar.args.crop_w')
  input_field :rotation_angle, types.Int, I18n.t('graphql.mutations.changeBubbleAvatar.args.rotation_angle')

  # resolve must return a hash with these keys
  return_field :bubble, BubbleType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    return custom_error('User is unauthorized', ctx) if user.nil?

    bubble = Bubble.find_by(id: inputs[:bubble_id])
    return custom_error('Bubble not found', ctx) if bubble.nil?
    return custom_error('Access denied', ctx) unless user.can_manage?(bubble)

    normalized_inputs = normalize_input_data(inputs)
    if user.apply_avatar_to_bubble(bubble, normalized_inputs[:picture_file], normalized_inputs[:filename], avatar_params(normalized_inputs))
      {bubble: bubble}
    else
      add_custom_error('Picture file is invalid', ctx)
    end
  end

  def avatar_params(params)
    {
        crop_x: params[:crop_x],
        crop_y: params[:crop_y],
        crop_h: params[:crop_h],
        crop_w: params[:crop_w],
        rotation_angle: params[:rotation_angle]
    }
  end

  def result_if_error_occurred
    {bubble: nil}
  end
end
