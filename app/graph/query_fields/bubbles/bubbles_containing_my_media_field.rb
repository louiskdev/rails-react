field = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "bubblesContainingMyMedia"
  type BubbleType.connection_type
  description 'Get bubbles with media files uploaded by current user'

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      gallery_ids = user.media.where(mediable_type: 'Widgets::GalleryWidget::Gallery').pluck(:mediable_id).uniq
      bubbles = user.bubbles.joins(:gallery_widgets).where(gallery_widget_galleries: {id: gallery_ids})

      bubbles
    end
  end

  def result_if_error_occurred
    []
  end

end

Bubbles::BubblesContainingMyMediaField = GraphQL::Relay::ConnectionField.create(field)
