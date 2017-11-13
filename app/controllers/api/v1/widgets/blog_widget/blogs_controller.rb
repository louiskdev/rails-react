class Api::V1::Widgets::BlogWidget::BlogsController < ApplicationController
  before_action :find_blog, only: [:show]

  def show
    page_number = parse_page_param
    return if page_number.nil?
    limit = Integer(params[:count]) rescue 20
    offset = page_number * limit

    @posts = @blog.posts #.offset(offset).limit(limit)
    @posts = if params[:sort_by] == 'popular'
               # @posts.joins('LEFT JOIN ratings on blog_widget_posts.id = ratings.ratingable_id').
               #     group("ratings.ratingable_id, blog_widget_posts.id").
               #     order("CASE WHEN avg(ratings.value) IS NULL THEN 0 ELSE avg(ratings.value) END, avg(ratings.value) desc").reverse_order
               @posts = @posts.to_a.sort_by! {|post| [(post.rating rescue 0), post.created_at] }.reverse!
               @posts = @posts.slice(offset, limit+1)
             else
               @posts.order(created_at: :desc).offset(offset).limit(limit+1)
             end

    if @posts.present?
      @load_more = if @posts.size == (limit + 1)
                     @posts = @posts.first(limit)
                     page_number > 0 # true
                   else
                     false
                   end

      @posts.each do |post|
        post.visits.create(user: current_user)
      end 
    else
      @load_more = false
    end

  end

  private

  def find_blog
    @blog = ::Widgets::BlogWidget::Blog.find(params[:id])
  end
end
