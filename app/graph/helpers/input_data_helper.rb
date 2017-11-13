module InputDataHelper

  def normalize_input_data(params)
    res = HashWithIndifferentAccess.new
    params.each do |arg, value|
      res[arg] = if value.is_a?(Integer) and value.negative?
                   nil
                 elsif value.is_a?(String) and value.empty?
                   nil
                 elsif value.is_a?(Array) and value[0].is_a?(String)
                   value.map { |name| name.strip }.reject {|name| name.blank? }
                 else
                   value
                 end
    end

    res
  end

end