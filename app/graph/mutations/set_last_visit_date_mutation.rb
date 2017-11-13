SetLastVisitDateMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "setLastVisitDate"
  description "Save date of current user's last visit to a specific page (page section)"

  # Accessible from `input` in the resolve function:
  input_field :url, !types.String
  input_field :section, types.String

  # resolve must return a hash with these keys
  return_field :status, !types.Boolean

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) do
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      attrs = {url: normalized_inputs[:url]}
      attrs[:section] = normalized_inputs[:section] if normalized_inputs[:section].present?

      attendance = user.attendances.find_by(attrs)
      if attendance.nil?
        new_attendance = user.attendances.create(attrs.merge(latest_date: DateTime.now))
        if new_attendance.new_record?
          return_errors(new_attendance, ctx)
        else
          {status: true}
        end
      elsif attendance.update(latest_date: DateTime.now)
        {status: true}
      else
        return_errors(attendance, ctx)
      end
    end
  end

  def result_if_error_occurred
    {status: false}
  end

end
