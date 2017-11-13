class SharedDoc < ActiveRecord::Base
  belongs_to :bubble
  belongs_to :user, foreign_key: :owner_id

  def content
    doc_obj = Document.find(self.doc_id_external)
    return nil if doc_obj.nil?
    return doc_obj.content.to_json
  end

end
