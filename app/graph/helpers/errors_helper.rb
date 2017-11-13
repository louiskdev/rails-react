module ErrorsHelper

  # One error
  def add_custom_error(text, ctx)
    ctx.errors << GraphQL::ExecutionError.new(text)
    GraphQL::Language::Visitor::SKIP
    result_if_error_occurred
  end
  alias custom_error add_custom_error

  # Many errors
  def return_errors(obj, ctx)
    obj.errors.full_messages.each { |msg| ctx.errors << GraphQL::ExecutionError.new(msg) }
    GraphQL::Language::Visitor::SKIP
    result_if_error_occurred
  end

  def result_if_error_occurred
    raise 'You should implement this method if you use ErrorsHelper'
  end

end
