if defined? GraphiQL
  # These are the default values:
  GraphiQL::Rails.config.query_params = false # if true, the GraphQL query string will be persisted the page's query params.
  GraphiQL::Rails.config.initial_query = nil # This string is presented to a new user
  GraphiQL::Rails.config.csrf = false # if true, CSRF token will added and sent along with POST request to the GraphQL endpoint
end
