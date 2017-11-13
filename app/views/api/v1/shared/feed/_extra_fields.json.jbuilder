if activity.extra_data.present?
  activity.extra_data.each do |key, value|
    begin
      raise JSON::ParserError if value.blank?
      hash = JSON.parse value.gsub(/:(\w+)=>/, '"\1": ')
      json.set! key.to_sym do
        hash.each do |k, v|
          json.set! k, v
        end
      end
    rescue JSON::ParserError
      json.set! key, value
    end
  end
end