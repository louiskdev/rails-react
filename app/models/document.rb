class Document
  include Mongoid::Document
  field :content, type: Hash
end
