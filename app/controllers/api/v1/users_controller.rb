class Api::V1::UsersController < ApplicationController
  skip_before_action :authenticate_user_from_token!, only: :create
  before_action :find_user_by_username, only: [:show, :foreign_gallery, :foreign_albums, :foreign_avatars]

  def show
    if @user.friends.pluck(:id).include?(current_user.id)
      @activities = @user.activities.newest.where(feed: true, privacy: [Activity.privacies[:p_friends], Activity.privacies[:p_public]]).
          where(object_type: 'Note')
    else
      render :show_as_guest, status: :ok
    end
  end

  def create
    @user = User.new(user_signup_params)
    if @user.save
      render :create, status: :created
    else
      invalid_signup_attempt
    end
  end

  def edit
  end

  def update
    if current_user.update_attributes(user_params)
      apply_interests(params[:interests]) if params[:interests].present?
      render :edit, status: :ok
    else
      render 'api/v1/shared/failure', locals: {errors: [current_user.errors]}, status: :unprocessable_entity
    end
  end

  def destroy
    user = current_user
    sign_out :user
    user.destroy
    render 'api/v1/shared/empty_response', status: :ok
  end

  def friends
    page_number = parse_page_param
    limit = Integer(params[:count]) rescue 10
    offset = page_number * limit

    @friends = current_user.friends.sort { |a, b| [(b.is_online_now? ? 1 : 0), b.last_wheelchat_message_date(current_user)] <=> [(a.is_online_now? ? 1 : 0), a.last_wheelchat_message_date(current_user)] }.
        slice(offset, limit+1)

    @load_more = if @friends.size == (limit + 1)
                   @friends = @friends.first(limit)
                   true   # page_number > 0
                 else
                   false
                 end
  end

  def upload_cover_image
    if params[:image].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'image' parameter should be present"}]}, status: :bad_request
      return
    end
    @user = current_user
    @user.assign_attributes(crop_x: params[:crop_x], crop_y: params[:crop_y], crop_h: params[:crop_h],
                            crop_w: params[:crop_w], rotation_angle: params[:rotation_angle])
    if @user.apply_cover_image(params[:image], params[:filename]) and @user.save
      render 'api/v1/users/show', status: :ok
    else
      render 'api/v1/shared/failure', locals: {errors: [message: 'Some error']}, status: :unprocessable_entity
    end
  end

  def unread_notifications
    @notifications = current_user.unread_notifications.all
  end

  def gallery
    page_number = parse_page_param
    return if page_number.nil?
    media_offset = page_number * Medium::ITEMS_PER_PAGE

    case params[:view_type]
      when 'by_me'
        @media = current_user.media.available_in_user_gallery.newest.offset(media_offset).limit(Medium::ITEMS_PER_PAGE)
      when 'of_me'
        @media = []
      when 'by_bubbles'
        @bubbles = current_user.bubbles
        render :gallery_bubbles, status: :ok and return
      else
        @media = current_user.media.available_in_user_gallery.newest.offset(media_offset).limit(Medium::ITEMS_PER_PAGE)
    end
    @media = @media.where(album_id: params[:album_id]) if params[:album_id].present?
    if params[:bubble_id].present?
      gallery = Bubble.find_by(id: params[:bubble_id]).gallery_widget rescue nil
      @media = @media.where(mediable_type: 'Widgets::GalleryWidget::Gallery',mediable_id: gallery.id) unless gallery.nil?
    end

    last_attendance_date = current_user.attendances.find_by(url: '/dashboard', section: "gallery").latest_date rescue DateTime.ordinal(0)
    @unviewed_media_count = current_user.media.available_in_user_gallery.where('created_at > ? ', last_attendance_date).count

    @media.each do |media|
      media.visits.create(user: current_user)
    end
  end

  def foreign_gallery
    page_number = parse_page_param
    return if page_number.nil?
    media_offset = page_number * Medium::ITEMS_PER_PAGE

    @media = @user.media.available_in_user_gallery.newest.offset(media_offset).limit(Medium::ITEMS_PER_PAGE)
    @media = @media.where(album_id: params[:album_id]) if params[:album_id].present?
    if params[:bubble_id].present?
      gallery = Bubble.find_by(id: params[:bubble_id]).gallery_widget rescue nil
      @media = @media.where(mediable_type: 'Widgets::GalleryWidget::Gallery',mediable_id: gallery.id) unless gallery.nil?
    end

    @media.each do |media|
      media.visits.create(user: current_user)
    end
  end

  def foreign_albums
    @albums = @user.albums.where(gallery_id: nil).order(updated_at: :desc)
    @avatars_count = @user.avatars.where(kind: Avatar.kinds[:common]).count
    @default_avatar_url = @user.avatar_url(:thumb)
  end

  def foreign_avatars
    @avatars = @user.avatars.where(kind: Avatar.kinds[:common])
  end

  def add_interests
    if params[:interests].present? and params[:interests].is_a?(Array)
      params[:interests].each do |input_interest_name|
        interest_name = input_interest_name.strip.downcase
        interest = Interest.find_by(name: interest_name)
        interest = Interest.create(name: interest_name) if interest.nil?
        UserInterest.create(interest_id: interest.id, user_id: current_user.id)
      end
      current_user.reload
      @interests = current_user.interests
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: "Parameter 'interests' is required"}] }, status: :bad_request
    end
  end

  def remove_interests
    if params[:interests].present? and params[:interests].is_a?(Array)
      params[:interests].each do |interest_name|
        interest = Interest.find_by(name: interest_name.downcase)
        UserInterest.destroy_all(interest_id: interest.id, user_id: current_user.id) unless interest.nil?
      end
      current_user.reload
      @interests = current_user.interests
      render :add_interests, status: :ok
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: "Parameter 'interests' is required"}] }, status: :bad_request
    end
  end

  def feed
    page_number = parse_page_param
    return if page_number.nil?
    limit = Integer(params[:count]) rescue 10
    offset = page_number * limit

    case params[:type]
      when 'own'
        @activities = Activity.joins('LEFT JOIN ignorings on activities.id = ignorings.ignorable_id').where(user_id: current_user.id, feed: true).
            where('ignorings.id IS NULL OR (ignorings.ignorable_type LIKE :model AND ignorings.user_id <> :user_id)', model: 'Activity', user_id: current_user.id)
            # where('activities.bubble_id IN (:bubble_ids) OR activities.bubble_id IS NULL', bubble_ids: bubble_ids)
        if params[:privacy].present? and ['private', 'friends', 'public'].include?(params[:privacy])
          @activities = @activities.where('activities.privacy = ?', Activity.privacies["p_#{params[:privacy]}"])
        end
      when 'friends'
        @activities = Activity.friends_feed_activities(current_user)
      else
        []
    end
    unless @activities.blank?
      @activities = if params[:sort_by] == 'popular'
                      @activities.to_a.sort_by! {|a| [(a.object.rating rescue 0), a.created_at] }.reverse!
                      @activities = @activities.slice(offset, limit+1)
                    else
                      @activities = @activities.order(created_at: :desc).offset(offset).limit(limit+1)
                    end
    end

    if @activities.present?
      @load_more = if @activities.size == (limit + 1)
                     @activities = @activities.first(limit)
                     page_number > 0 # true
                   else
                     false
                   end

      if params[:type] == 'friends'
        last_attendance_date = current_user.attendances.find_by(url: '/dashboard', section: "#{params[:type]}_feed").latest_date rescue DateTime.ordinal(0)
        @unread_activities_count = 0
        @activities.each { |activity| @unread_activities_count += 1 if activity.created_at > last_attendance_date }
      else
        @unread_activities_count = 0
      end

      @activities.each do |activity|
        activity.object.visits.create(user: current_user) rescue nil
      end
    else
      @load_more = false
    end

  end

  def hide_activity
    @activity = Activity.find_by(id: params[:id])
    if @activity.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Activity is not found'}]}, status: :not_found
    else
      if @activity.user == current_user
        if @activity.feed? and !@activity.p_private?
          current_user.friends.ids.each do |friend_id|
            # ActionCable.server.broadcast "dashboard_user_#{friend_id}", {removed_activity: {activity_id: @activity.id}}

            Pusher.trigger("private-dashboard-#{friend_id}", 'activity_removed', activity_id: @activity.id)
          end
        end
        @activity.update(feed: false)
      end
      current_user.ignorings.create(ignorable_type: @activity.class.name, ignorable_id: @activity.id)
      render 'api/v1/shared/empty_response'
    end
  end

  def hide_activities
    if params[:ids].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'ids' parameter should be present"}]}, status: :bad_request
    else
      Activity.where(id: params[:ids]).each do |activity|
        if activity.user == current_user
          if activity.feed? and !activity.p_private?
            current_user.friends.ids.each do |friend_id|
              # ActionCable.server.broadcast "dashboard_user_#{friend_id}", {removed_activity: {activity_id: activity.id}}

              Pusher.trigger("private-dashboard-#{friend_id}", 'activity_removed', activity_id: @activity.id)
            end
          end
        end
        current_user.ignorings.create(ignorable_type: activity.class.name, ignorable_id: activity.id) unless activity.nil?
      end
      render 'api/v1/shared/empty_response'
    end
  end

  def attendances
    attendance_attrs = {url: params[:url], section: params[:section]}
    @attendance = current_user.attendances.find_by(attendance_attrs)
    if @attendance.nil?
      current_user.attendances.create(attendance_attrs.merge(latest_date: DateTime.now))
    else
      @attendance.update(latest_date: DateTime.now)
    end
    render 'api/v1/shared/empty_response'
  end

  private
  def user_signup_params
    params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :agree_to_terms)
  end

  def user_params
    params.require(:user).permit(:email, :username, :first_name, :gender, :zip_code, :birthday, :phone, :language)
  end

  def invalid_signup_attempt
    warden.custom_failure!
    render 'api/v1/shared/failure', locals: {errors: [@user.errors]}, status: :unprocessable_entity
  end

  def apply_interests(interest_names)
    interest_names ||= []
    interest_names.map do |interest_name|
      interest_name.strip!
      interest_name.downcase!
    end

    #destory non actual user_intersts
    current_user.interests.each do |interest|
      unless interest_names.include?(interest.name)
        UserInterest.where(user_id: current_user.id, interest_id: interest.id).destroy_all
        #####  FIXME  needs to decrement counter?
        # interest.counter -= 1
        # interest.save!
      end
    end

    # add new interests to user
    interest_names.each do |interest_name|
      interest = Interest.where(name: interest_name).first
      interest = Interest.create(name: interest_name) if interest.nil?
      if UserInterest.where(user_id: current_user.id, interest_id: interest.id).blank?
        interest.users << current_user
        interest.save!
      end
    end
    current_user.reload
  end

  def find_user_by_username
    @user = User.find_by(username: params[:id])
    if @user.nil?
      render 'api/v1/shared/failure', locals: {errors: [{message: "User not found"}]}, status: :not_found
    end
  end
end