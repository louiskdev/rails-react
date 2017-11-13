class Widget < ActiveRecord::Base
  belongs_to :widgetable, polymorphic: true, dependent: :destroy
  belongs_to :bubble

  validates :widgetable_type, uniqueness: { scope: :bubble_id }

  default_scope -> { where(enabled: true) }

  def name
    case widgetable_type
      when 'Widgets::GalleryWidget::Gallery' then 'Gallery'
      when 'Widgets::ChatWidget::Chat' then 'Chat'
      when 'Widgets::BlogWidget::Blog' then 'Blog'
      when 'Widgets::EventsWidget::Events' then 'Events'
      when 'Widgets::FilesWidget::Files' then 'Files'
      else
        ''
    end
  end
end
