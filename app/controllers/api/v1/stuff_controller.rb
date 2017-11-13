class Api::V1::StuffController < ApplicationController

  def search
    @search_results = []
    if params[:interests].blank?
      render(:search, status: :ok) and return
    end

    # find ids of known interests
    interest_ids = []
    if params[:interests].present? and params[:interests].is_a?(Array)
      params[:interests].each do |interest|
        interest_ids << Interest.where('name LIKE ?', "#{interest.downcase}").pluck(:id).first

        # increment freq field value
        Suggestion.where(keyword: [interest, interest.downcase]).each do |suggestion|
          suggestion.update_attribute(:freq, suggestion.freq + 1)
        end
      end
    end

    own_bubble_ids = current_user.bubbles.pluck(:id)

    if params[:search_by] == 'bubbles'
      bubbles_by_name_sql = params[:interests].map {|el| "bubbles.name ILIKE '%#{el}%'" }.join(' AND ')
      bubble_ids_by_interests = BubbleInterest.select('bubble_id').where(interest_id: interest_ids).group('bubble_id').having("count(*) = #{interest_ids.size}").pluck(:bubble_id)

      # find public bubbles
      bubbles_query = Bubble.distinct.where.not(id: own_bubble_ids).where('bubbles.kind' => Bubble.kinds[:common])
      if params[:zip_code].present?
        bubbles_query = params[:radius].present? ? bubbles_query.near(params[:zip_code], params[:radius]) : bubbles_query.near(params[:zip_code])
      end
      bubbles_query = bubbles_query.where('(bubbles.id IN (:ids)) OR ('+bubbles_by_name_sql+')', ids: bubble_ids_by_interests)
      bubbles = bubbles_query.all
      # p "bubbles:"
      # p bubbles


      # find global bubbles
      global_bubbles_query = Bubble.distinct.where.not(id: own_bubble_ids).where('bubbles.kind' => Bubble.kinds[:global])
      global_bubbles_query = global_bubbles_query.where('(bubbles.id IN (:ids)) OR ('+bubbles_by_name_sql+')', ids: bubble_ids_by_interests)
      global_bubbles = global_bubbles_query.to_a
      @search_results =  global_bubbles | bubbles

    elsif params[:search_by] == 'users'

      # find users
      users_query = User.distinct.where.not('users.id' => current_user.id)
      if params[:zip_code].present?
        users_query = params[:radius].present? ? users_query.near(params[:zip_code], params[:radius]) : users_query.near(params[:zip_code])
      end
      user_ids_by_interests = UserInterest.select('user_id').where(interest_id: interest_ids).group('user_id').having("count(*) = #{interest_ids.size}").pluck(:user_id)
      users_query = users_query.where(id: user_ids_by_interests)
      users = users_query.all
      # p "users:"
      # p users
      @search_results = users
    end

    # @search_results = (bubbles | users).sort_by {|el| el.try(:distance) }
  end

  def search_suggestions
    @suggestions = Suggestion.where('keyword ILIKE ?', "%#{params[:keyword]}%").order(freq: :desc).limit(8).pluck(:keyword)
  end

  def interest_suggestions
    @interests = Interest.where('name ILIKE ?', "%#{params[:keyword]}%").order(counter: :desc).limit(8)
    render :interests
  end

  def trending_interests
    page_number = parse_page_param
    limit = Integer(params[:count]) rescue 9
    offset = page_number * limit
    @interests = Interest.order(counter: :desc).offset(offset).limit(limit)
    render :interests
  end

  def link_preview
    if params[:link].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'link' parameter should be present"}]}, status: :bad_request
    else
      @link_data = LinkThumbnailer.generate(params[:link]) rescue nil
    end
  end

  def today
    @bubbles = Bubble.common_or_global.where(created_at: Date.today...Date.tomorrow).near(current_user.zip_code, 20, :units => :mi)
    render :bubbles
  end

  def top_rated
    @bubbles = []
    render :bubbles
  end

  def near_me
    # own_bubble_ids = current_user.bubbles.pluck(:id)
    @bubbles = Bubble.common_or_global.near(current_user.zip_code, 10, :units => :mi)  #distinct.where.not(id: own_bubble_ids).
    render :bubbles
  end

  def featured
    @bubbles = [] # Bubble.where(kind: Bubble.kinds[:common]).order('random()').limit(5)
    render :bubbles
  end

  def image_preload
    if params[:picture_file].blank?
      render 'api/v1/shared/failure', locals: {errors: [{message: "'picture_file' parameter should be present"}]}, status: :bad_request
    else
      uploader = TmpUploader.new
      uploader.store!(params[:picture_file])
      @url = uploader.url
    end
  end

  def validate
    validation_errors = []
    if params[:username].present?
      @field = 'username'
      validation_errors = validate_username(params[:username])
    elsif params[:zip_code].present?
      @field = 'zip_code'
      validation_errors = validate_zip_code(params[:zip_code])
    else
      render 'api/v1/shared/failure', locals: {errors: [{message: 'Bad request'}]} and return
    end
    
    if validation_errors.present?
      render 'api/v1/shared/failure', locals: {errors: [{@field => validation_errors}]}
    end
  end

  private
  def validate_username(value)
    user = User.new
    user.username = value
    user.valid?
    user.errors[:username]
  end

  def validate_zip_code(value)
    pattern = "#{value}, USA"
    if Geocoder.search(pattern).map! { |e| e.data['formatted_address'] }.delete_if { |e| e !~ /#{pattern}/ }.blank?
      ['invalid US zipcode']
    else
      nil
    end
  end

end
