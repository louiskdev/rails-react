VideoUploadingProgressResult = Struct.new(:state, :media, :progress)

Media::VideoUploadingProgressField = GraphQL::Field.define do
  self.extend(ErrorsHelper)

  name "videoUploadingProgress"
  type UploadingProcessDataType
  description 'Get detailed video uploading process data from Zencoder'

  argument :job_id, !types.String
  argument :media_id, !types.Int

  resolve -> (obj, args, ctx) do
    user = ctx[:current_user]
    if user.nil?
      add_custom_error('User is unauthorized', ctx)
    else
      begin
        response = Zencoder::Job.progress(args[:job_id])
      rescue Zencoder::Error => e
        debug_info = {
            location: 'Media::VideoUploadingProgressField',
            date: Time.now,
            user_id: user.id,
            job_id: args[:job_id],
            message: e.message,
            backtrace: e.backtrace
        }
        Bugsnag.notify(e, debug_info)
        sleep(2)
        retry
      end
      if response.success?
        result = VideoUploadingProgressResult.new(response.body['state'], [])
        MIN_PROGRESS_VALUE ||= 1
        PROGRESS_VALUE_IF_ERROR ||= -1   # Zencoder returns an error or some error occurred

        result[:progress] = case response.body['state']
                              when 'failed', 'cancelled', 'no input', 'skipped'
                                media = Medium.find_by(id: args[:media_id])
                                media.attachmentable.update(recoding_job_key: nil) if media.present? and media.type == 'video'
                                PROGRESS_VALUE_IF_ERROR
                              when 'waiting', 'queued', 'assigning' then MIN_PROGRESS_VALUE
                              when 'processing' 
                                progress = response.body['progress'].to_i
                                progress = 99 if progress > 99
                                progress = MIN_PROGRESS_VALUE if progress < MIN_PROGRESS_VALUE
                                progress
                              when 'finished'
                                media = Medium.find_by(id: args[:media_id])
                                return custom_error('Video not found', ctx) if media.nil? or media.type != 'video'

                                media.attachmentable.update(recoding_job_key: nil)
                                result[:media] << media
                                100 # progress value
                              else
                                PROGRESS_VALUE_IF_ERROR # some error occured or unknown state
                            end

        result
      else
        return_errors(response, ctx)
      end
    end
  end

  def result_if_error_occurred
    nil
  end

end
