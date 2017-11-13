field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name "bubbleMembers"
  type UserType.connection_type
  description I18n.t('graphql.queries.bubbleMembers.description')

  argument :bubble_id, !types.Int, I18n.t('graphql.queries.bubbleMembers.args.bubble_id')
  argument :keyword, types.String, I18n.t('graphql.queries.bubbleMembers.args.keyword')

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      bubble = Bubble.find_by(id: args[:bubble_id])
      return custom_error('Bubble not found', ctx) if bubble.nil?
      return custom_error('Access denied', ctx) if bubble.privy? and !user.is_member_of?(bubble)

      normalized_args = normalize_input_data(args)
      ctx[:bubble] = bubble  # add bubble to context
      members = if normalized_args[:keyword].present?
                  bubble.members.where("username ILIKE :pattern OR first_name ILIKE :pattern", pattern: "%#{normalized_args[:keyword]}%")
                else
                  bubble.members
                end
      members
    end
  end

  def result_if_error_occurred
    []
  end
end

Bubbles::BubbleMembersField = GraphQL::Relay::ConnectionField.create(field)
