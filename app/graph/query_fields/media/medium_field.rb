Media::MediumField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "medium"
  type !MediumType
  description 'Get medium entry by ID'

  argument :id, !types.Int

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      medium = Medium.find_by(id: args[:id]) # .available_in_user_gallery
      if medium.nil?
        add_custom_error('Media file not found', ctx)
      else
        medium.visits.create(user: user)
        medium
      end
    end
  end

  def result_if_error_occurred
    nil
  end
end
