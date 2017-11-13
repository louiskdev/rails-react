field = GraphQL::Field.define do
  self.extend(InputDataHelper, ErrorsHelper)

  name 'bubbleInvitableUsers'
  type UserType.connection_type
  description 'Get invitable users of bubble'

  argument :bubble_id, types.Int
  argument :keyword, types.String

  resolve -> (obj, args, ctx) do
    if ctx[:current_user].blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_args = normalize_input_data(args)
      user = ctx[:current_user]
      users = user.friends
        .joins('LEFT JOIN bubble_members ON users.id = bubble_members.user_id AND bubble_members.bubble_id = ' + normalized_args[:bubble_id].to_s)
        .where("bubble_members.user_id IS NULL")

      if normalized_args[:keyword].present?
        users = users.where("users.username ILIKE :text OR users.first_name ILIKE :text", text: "%#{normalized_args[:keyword]}%")
      end

      users
    end
  end

  def result_if_error_occurred
    []
  end
end

Bubbles::BubbleInvitableUsersField = GraphQL::Relay::ConnectionField.create(field)
