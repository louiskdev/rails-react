Connections::ActivitiesWithUnreadCountConnectionType = ActivityType.define_connection do
  name 'ActivitiesWithUnreadCountConnection'

  field :unread_activities_count do
    type !types.Int
    # `obj` is the Connection
    resolve -> (obj, args, ctx) do
      if ctx[:unread_activities_count].blank?
        ctx.errors << GraphQL::ExecutionError.new('Undefined `unread_activities_count` issue!')
        GraphQL::Language::Visitor::SKIP
        -1
      else
        ctx[:unread_activities_count]
      end
    end
  end
end
