json_response(json) do
  json.set! :search_results do
    json.array! @search_results do |sr|
      case sr.class.name
        when 'User' then json.partial!('user', user: sr)
        when 'Bubble' then json.partial!('bubble', bubble: sr)
      end
      json.model sr.class.name
    end
  end
end