Connections::LikersConnectionType = UserType.define_connection do
  name 'LikersConnection'

  field :other_likers_count do
    type !types.Int

    # `obj` is the Connection
    resolve -> (obj, args, ctx) { ctx[:other_likers_count] || 0 }
  end
end
