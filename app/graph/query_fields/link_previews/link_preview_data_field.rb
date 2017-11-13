LinkPreviews::LinkPreviewDataField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "linkPreviewData"
  type LinkPreviewType
  description 'Get link preview data by url'

  argument :link, !types.String

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      begin
        data = LinkThumbnailer.generate(args[:link])
        LinkPreview.new(url: data.url, title: data.title, description: data.description, picture_url: data.images.first.try(:src))
      rescue
        add_custom_error( 'Failed to get link preview', ctx)
      end
    end
  end

  def result_if_error_occurred
    nil
  end

end
