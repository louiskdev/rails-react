Media::CreateMediumMutation = GraphQL::Relay::Mutation.define do
  self.extend(InputDataHelper, ErrorsHelper)

  # Used to name derived types:
  name "createMedium"
  description I18n.t('graphql.mutations.createMedium.description')

  # Accessible from `input` in the resolve function:
  input_field :title, types.String, I18n.t('graphql.mutations.createMedium.args.title')
  input_field :album_id, types.Int, I18n.t('graphql.mutations.createMedium.args.album_id')
  input_field :bubble_id, types.Int, I18n.t('graphql.mutations.createMedium.args.bubble_id')
  input_field :picture_file, !types.String, I18n.t('graphql.mutations.createMedium.args.picture_file')
  input_field :filename, types.String, I18n.t('graphql.mutations.createMedium.args.filename')
  # input_field :video_file, types.File

  # resolve must return a hash with these keys
  return_field :medium, MediumType

  # The resolve proc is where you alter the system state.
  resolve -> (root_obj, inputs, ctx) {
    user = ctx[:current_user]
    if user.blank?
      add_custom_error('User is unauthorized', ctx)
    else
      normalized_inputs = normalize_input_data(inputs)
      media = user.media.build(media_params(normalized_inputs))

      if normalized_inputs[:bubble_id].present?
        bubble = Bubble.find_by(id: normalized_inputs[:bubble_id])
        return custom_error('Bubble not found', ctx) if bubble.nil?
        return custom_error('Associated gallery widget not found', ctx) if bubble.gallery_widget.nil?
        if bubble.common? # public bubble
          return custom_error('Access denied', ctx) unless user.is_member_of?(bubble)
        else # global or private bubble
          return custom_error('Access denied', ctx) unless user.can_manage?(bubble)
        end
        media.mediable = bubble.gallery_widget
      end

      if normalized_inputs[:album_id].present?
        album = if normalized_inputs[:bubble_id].present?
                  Album.find_by(id: normalized_inputs[:album_id], gallery_id: bubble.gallery_widget.id)
                else
                  Album.find_by(id: normalized_inputs[:album_id], user_id: user.id)
                end
        return custom_error('Album not found', ctx) if album.nil?
        media.album = album
      end

      if normalized_inputs[:picture_file].present?
        attachment = ::Attachments::Picture.new
        unless attachment.add_encoded_attachment(normalized_inputs[:picture_file], normalized_inputs[:filename])
          return add_custom_error('Picture is invalid', ctx)
        end
      elsif normalized_inputs[:video_file].present?
        attachment = ::Attachments::Video.new(file: normalized_inputs[:video_file])
      else
        attachment = nil
      end
      return add_custom_error('Attachment is absent', ctx) if attachment.blank?
      media.attachmentable = attachment

      if media.save
        {medium: media}
      else
        return_errors(media, ctx)
      end
    end
  }

  def media_params(hash)
    { title: hash[:title] }
  end

  def result_if_error_occurred
    {medium: nil}
  end

end
