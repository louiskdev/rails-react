if album.nil?
  json.album ''
else
  json.set! :album do
    json.extract! album, :id, :name
  end
end
