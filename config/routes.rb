require 'resque/server'

Rails.application.routes.draw do

  # GraphQL Endpoint
  post :graphql, to: 'graphql#create'

  if Rails.env.development?
    # GraphiQL Editor
    mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql"
    # Resque Dashboard
    mount Resque::Server, at: '/jobs'
  end

  devise_for :users, only: []

  namespace :api, defaults: { format: :json } do
    namespace :v1 do
      resources :bubbles, except: [:index] do
        member do
          get 'chat', to: "widgets/chat_widget/chats#show"
          post :join_me
          post :disjoin_me
          post 'disjoin/:member_id', to: "bubbles#disjoin"
          match 'member/:member_id', to: "bubbles#member", via: [:put, :patch]
          post 'upload/cover_image', to: 'bubbles#upload_cover_image'
          post 'upload/avatar', to: 'bubbles#upload_avatar'
          get :members
          post :like
          post :unlike
          get :feed
        end
        get :join_member, on: :collection, defaults: { format: :html }
      end
      get :my_bubbles, to: "bubbles#my_bubbles"
      get :recommended_bubbles, to: "bubbles#recommended_bubbles"

      resource :bubble_invitation, only: [:create, :update] do
        collection do
          post 'generate/user', to: "bubble_invitations#generate_user"
        end
      end
      resources :users, only: [:create, :show] do
        member do
          get :gallery, to: 'users#foreign_gallery', param: :profile_url # FIXME: profile_url -> username
          get :albums, to: 'users#foreign_albums', param: :profile_url # FIXME: profile_url -> username
          get :avatars, to: 'users#foreign_avatars', param: :profile_url # FIXME: profile_url -> username
        end
      end
      resource :user, only: [:edit, :update, :destroy] do
        get :friends
        get :unread_notifications
        get :gallery
        get :feed
        post 'upload/cover_image', to: 'users#upload_cover_image'
        post :interests, to: 'users#add_interests'
        post 'activities/hide', to: 'users#hide_activities'
        post 'activities/:id/hide', to: 'users#hide_activity'
        post :attendances
        delete :interests, to: 'users#remove_interests'
      end
      scope :user do
        resources :avatars, only: [:create, :update, :destroy, :index], controller: "user_avatars" do
          member do
            post :default, to: "user_avatars#set_default"
          end
        end
        resources :notes, except: [:new, :edit, :update] do
          member do
            post :like
            delete :unlike
            post :comments, to: 'notes#add_comment'
            post :rate
          end
        end
        resources :albums, only: [:index, :destroy]
        resources :friendships, only: [:create, :update, :destroy], param: 'friend_id'
      end
      resources :notifications, only: [:destroy] do
        collection do
          delete 'destroy_all', to: "notifications#destroy_all"
        end
      end
      resources :sessions, only: [:create, :destroy]
      devise_scope :user do
        resource :password, only: [:create], controller: :passwords
        resource :password, only: [:edit, :update], controller: :passwords, defaults: { format: :html }
        post 'confirmations/resend', to: 'confirmations#resend', as: :resend_confirmation_email
        post 'confirmations', to: 'confirmations#create', as: :confirmations
        get 'confirmations', to: 'confirmations#show', as: :finish_confirmations, defaults: { format: :html }
      end
      get :search, to: "stuff#search", as: :search
      get 'search/suggestions', to: "stuff#search_suggestions", as: :search_suggestions
      get :interest_suggestions, to: "stuff#interest_suggestions", as: :interest_suggestions
      get :trending_interests, to: "stuff#trending_interests", as: :trending_interests
      get :link_preview, to: "stuff#link_preview"
      get :today, to: "stuff#today"
      get :top_rated, to: "stuff#top_rated"
      get :near_me, to: "stuff#near_me"
      get :featured, to: "stuff#featured"
      get :validate, to: "stuff#validate"
      post :image_preload, to: "stuff#image_preload"

      post '/media/:id/put', to: 'media#put', as: :put_media
      post '/media/:id/like', to: 'media#like', as: :like_media
      delete '/media/:id/unlike', to: 'media#unlike', as: :unlike_media
      post '/media/:id/comments', to: 'media#add_comment', as: :add_comment
      resources :media, only: [:create, :show, :update, :destroy] do
        collection do
          post :upload_video
          post :upload_videos
          post :upload_pictures
        end
      end
      resources :albums, only: [:create]
      resources :comments, only: [:index] do
        member do
          post :like
          delete :unlike
        end
      end

      post '/upload_file', to: 'upload#create'

      ####    WHEELCHAT   ####
      resources :wheelchats, only: [:update, :destroy], param: :channel_name, controller: 'wheel_chat/chats' do
        member do
          get 'recent_messages', to: 'wheel_chat/chats#recent_messages'
          post 'send_message', to: 'wheel_chat/chats#send_message'
          post 'clear_notifications', to: 'wheel_chat/chats#clear_notifications'
        end
        collection do
          get 'friends_online', to: 'wheel_chat/chats#friends_online'
          get 'friends_filter', to: 'wheel_chat/chats#friends_filter'
          delete 'messages/:id/remove_attachment', to: 'wheel_chat/chats#remove_attachment'
        end
      end

      ####     WIDGETS     ####
      scope '/w', module: 'widgets/chat_widget' do
        resources :chats, only: [:show] do
          get 'recent_messages', to: 'messages#recent_messages'
          resources :messages, only: [:create]
          collection do
            delete 'messages/:id/remove_attachment', to: 'messages#remove_attachment'
          end
        end
      end
      scope '/w', module: 'widgets/gallery_widget' do
        resources :galleries, only: [:show] do
          resources :media, except: [:new, :edit, :index]
          resources :albums, except: [:new]
        end
      end
      scope '/w', module: 'widgets/blog_widget' do
        resources :blogs, only: [:show] do
          resources :posts, except: [:new, :edit, :index] do
            member do
              post :like
              delete :unlike
              post :comments, to: 'posts#add_comment'
              post :rate, to: 'posts#rate'
            end
          end
        end
      end

      ### feedback ###
      post 'feedback', to: "feedback#create"

      ### facebook ###
      post 'fb-authorize', to: "facebook#authorize"

      ####   CALLBACKS  #####
      resource :zencoder, only: :create
      post 'pusher/auth', to: 'pusher#auth'
      post 'pusher/webhook', to: 'pusher#webhook'

    end   # of 'namespace :v1 do'
  end

  root 'home#index'
  post '/', to: 'home#index'
  # React Router needs a wildcard
  #get "react-router(/*all)", to: "home#index"
  get '*path', to: 'home#index'

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
