json_response(json) do
  json.set! :media do
    json.extract! @media, :id
    json.thumb_url ''
    json.video_links []
    json.recoding_job_id @job_id
  end
end
