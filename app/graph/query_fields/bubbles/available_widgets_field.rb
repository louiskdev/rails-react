Bubbles::AvailableWidgetsField = GraphQL::Field.define do
  name "availableWidgets"
  type types[types.String]
  description I18n.t('graphql.queries.availableWidgets.description')

  resolve -> (obj, args, ctx) do
    ['Blog', 'Chat', 'Gallery', 'Events', 'Files']
  end
end
