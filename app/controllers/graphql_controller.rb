class GraphqlController < ApplicationController
  before_action :authenticate_user_from_access_token, only: :create

  def create
    result = if params['_json'].present? # batching is on
               req_results = []
               params['_json'].each do |req|
                 req_results << Schema.execute(
                     req[:query],
                     variables: normalized_query_variables(req[:variables]),
                     context: {
                         current_user: current_user,  # Add the current_user into the query context
                         file: request.params[:file]  # Add file into the query context
                     }
                 )
               end
               req_results
             else # batching is off
               query_string = params[:query]
               Schema.execute(
                   query_string,
                   variables: normalized_query_variables(params[:variables]),
                   context: {
                       current_user: current_user,  # Add the current_user into the query context
                       file: request.params[:file]  # Add file into the query context
                   }
               )
            end

    render json: result
  end

  private
  def normalized_query_variables(vars)
    query_variables = vars
    query_variables = {} if query_variables.blank?
    query_variables = JSON.parse(query_variables) if query_variables.is_a?(String)
    query_variables
  end

  def authenticate_user_from_access_token
    auth_token = request.headers['Authorization']
    client_id  = request.headers['Client-ID']
    authenticate_with_auth_token(auth_token, client_id) if auth_token
  end

  def authenticate_with_auth_token(auth_token, client_id)
    return unless auth_token.include?(':')

    user_id = auth_token.split(':').first
    user = User.joins(:api_keys).find_by(id: user_id, api_keys: {client_id: client_id})
    return if user.nil?

    if Rails.configuration.auth_token_expired_at and user.current_sign_in_at.present?
      if user.current_sign_in_at + Rails.configuration.auth_token_expired_at < DateTime.now.utc
        ApiKey.destroy_all(user_id: user.id, client_id: client_id, access_token: auth_token)
        return
      end
    end

    apik = user.present? ? user.api_keys.find_by(client_id: client_id) : nil
    if apik && Devise.secure_compare(apik.access_token, auth_token)
      # User can access
      apik.touch
      user.current_client_id = client_id
      sign_in user, store: false
    end
  end

end
