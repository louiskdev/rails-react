class LinkPreview < ActiveRecord::Base
  belongs_to :link_previewable, polymorphic: true

  validates :url, presence: true
end
