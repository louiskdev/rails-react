# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20170306104550) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "hstore"

  create_table "active_users", force: :cascade do |t|
    t.date    "date"
    t.integer "count"
  end

  create_table "activities", force: :cascade do |t|
    t.string   "name"
    t.integer  "user_id"
    t.inet     "user_ip"
    t.string   "object_type"
    t.integer  "object_id"
    t.integer  "bubble_id"
    t.boolean  "feed",             default: false
    t.integer  "privacy"
    t.hstore   "extra_data"
    t.datetime "created_at",                       null: false
    t.datetime "updated_at",                       null: false
    t.integer  "event_id"
    t.boolean  "shared",           default: false
    t.integer  "original_user_id"
  end

  add_index "activities", ["user_id"], name: "index_activities_on_user_id", using: :btree

  create_table "albums", force: :cascade do |t|
    t.string   "name"
    t.string   "description"
    t.integer  "user_id"
    t.datetime "created_at",               null: false
    t.datetime "updated_at",               null: false
    t.integer  "gallery_id"
    t.integer  "privacy"
    t.integer  "likers_count", default: 0
  end

  add_index "albums", ["user_id"], name: "index_albums_on_user_id", using: :btree

  create_table "api_keys", force: :cascade do |t|
    t.string   "access_token", null: false
    t.integer  "user_id"
    t.datetime "created_at",   null: false
    t.datetime "updated_at",   null: false
    t.string   "client_id",    null: false
  end

  create_table "attachment_pictures", force: :cascade do |t|
    t.string   "file"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "attachment_videos", force: :cascade do |t|
    t.string   "file"
    t.string   "source_area"
    t.datetime "created_at",       null: false
    t.datetime "updated_at",       null: false
    t.string   "recoding_job_key"
  end

  create_table "avatars", force: :cascade do |t|
    t.string   "picture"
    t.string   "avatarable_type"
    t.integer  "avatarable_id"
    t.integer  "kind"
    t.datetime "created_at",      null: false
    t.datetime "updated_at",      null: false
  end

  create_table "blog_widget_blogs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "blog_widget_posts", force: :cascade do |t|
    t.text     "text"
    t.string   "title"
    t.integer  "user_id"
    t.integer  "blog_id"
    t.integer  "likers_count", default: 0
    t.datetime "created_at",               null: false
    t.datetime "updated_at",               null: false
  end

  create_table "bubble_blocked_users", force: :cascade do |t|
    t.integer  "bubble_id"
    t.integer  "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "bubble_interests", force: :cascade do |t|
    t.integer  "bubble_id"
    t.integer  "interest_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  add_index "bubble_interests", ["bubble_id"], name: "index_bubble_interests_on_bubble_id", using: :btree
  add_index "bubble_interests", ["interest_id"], name: "index_bubble_interests_on_interest_id", using: :btree

  create_table "bubble_invitations", force: :cascade do |t|
    t.string   "token"
    t.integer  "status"
    t.integer  "bubble_id"
    t.integer  "new_member_id"
    t.string   "new_member_email"
    t.integer  "moderator_id"
    t.integer  "originator"
    t.datetime "created_at",       null: false
    t.datetime "updated_at",       null: false
    t.integer  "notification_id"
  end

  add_index "bubble_invitations", ["bubble_id"], name: "index_bubble_invitations_on_bubble_id", using: :btree

  create_table "bubble_members", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "bubble_id"
    t.integer  "user_role",                  null: false
    t.datetime "created_at",                 null: false
    t.datetime "updated_at",                 null: false
    t.boolean  "online",     default: false
  end

  add_index "bubble_members", ["bubble_id"], name: "index_bubble_members_on_bubble_id", using: :btree
  add_index "bubble_members", ["user_id"], name: "index_bubble_members_on_user_id", using: :btree

  create_table "bubbles", force: :cascade do |t|
    t.string   "name"
    t.string   "description"
    t.string   "zip_code"
    t.string   "permalink"
    t.integer  "kind",                        null: false
    t.boolean  "invitable"
    t.datetime "created_at",                  null: false
    t.datetime "updated_at",                  null: false
    t.float    "latitude"
    t.float    "longitude"
    t.string   "cover_image"
    t.integer  "likers_count",    default: 0
    t.integer  "members_count",   default: 0, null: false
    t.integer  "interests_count", default: 0, null: false
  end

  add_index "bubbles", ["latitude", "longitude"], name: "index_bubbles_on_latitude_and_longitude", using: :btree

  create_table "call_sessions", force: :cascade do |t|
    t.integer  "initiator_id"
    t.integer  "receiver_id"
    t.string   "session_id"
    t.string   "call_type"
    t.datetime "created_at",               null: false
    t.datetime "updated_at",               null: false
    t.integer  "channel_id",   default: 0
  end

  create_table "chat_widget_channel_members", force: :cascade do |t|
    t.integer "channel_id"
    t.integer "user_id"
  end

  create_table "chat_widget_channels", force: :cascade do |t|
    t.integer "chat_id"
    t.integer "creator_id"
    t.string  "name"
    t.integer "kind"
  end

  create_table "chat_widget_chats", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "chat_widget_messages", force: :cascade do |t|
    t.text     "text"
    t.integer  "user_id"
    t.integer  "chat_id"
    t.string   "video_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer  "channel_id"
  end

  create_table "chat_widget_onlines", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "chat_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "comments", force: :cascade do |t|
    t.integer  "commentable_id"
    t.string   "commentable_type"
    t.string   "title"
    t.text     "body"
    t.string   "subject"
    t.integer  "user_id",                      null: false
    t.integer  "parent_id"
    t.integer  "lft"
    t.integer  "rgt"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "likers_count",     default: 0
  end

  add_index "comments", ["commentable_id", "commentable_type"], name: "index_comments_on_commentable_id_and_commentable_type", using: :btree
  add_index "comments", ["user_id"], name: "index_comments_on_user_id", using: :btree

  create_table "event_members", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "event_id"
    t.integer  "user_role"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "events", force: :cascade do |t|
    t.string   "name"
    t.string   "permalink"
    t.string   "cover_image"
    t.string   "kind"
    t.integer  "owner_id"
    t.integer  "likers_count"
    t.integer  "members_count"
    t.datetime "start_date"
    t.text     "description"
    t.datetime "created_at",    null: false
    t.datetime "updated_at",    null: false
    t.integer  "events_id"
    t.string   "address"
  end

  create_table "events_widget_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "favorite_activities", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "activity_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  create_table "feedbacks", force: :cascade do |t|
    t.boolean  "use_another_social"
    t.string   "use_another_social_period"
    t.integer  "score"
    t.text     "content"
    t.datetime "created_at",                null: false
    t.datetime "updated_at",                null: false
  end

  create_table "files_widget_files", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "friendships", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "friend_id"
    t.integer  "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "gallery_widget_galleries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "hashtag_activities", force: :cascade do |t|
    t.integer  "hashtag_id"
    t.integer  "activity_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  create_table "hashtag_posts", force: :cascade do |t|
    t.integer  "hashtag_id"
    t.integer  "post_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "hashtags", force: :cascade do |t|
    t.string   "name"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.integer  "posts_count"
  end

  create_table "identities", force: :cascade do |t|
    t.integer  "user_id"
    t.string   "provider"
    t.string   "uid"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_index "identities", ["user_id"], name: "index_identities_on_user_id", using: :btree

  create_table "ignorings", force: :cascade do |t|
    t.integer  "user_id"
    t.string   "ignorable_type"
    t.integer  "ignorable_id"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
    t.string   "location"
  end

  create_table "interests", force: :cascade do |t|
    t.string   "name"
    t.integer  "counter",    default: 0, null: false
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  add_index "interests", ["name"], name: "index_interests_on_name", using: :btree

  create_table "likes", force: :cascade do |t|
    t.string   "liker_type"
    t.integer  "liker_id"
    t.string   "likeable_type"
    t.integer  "likeable_id"
    t.datetime "created_at"
  end

  add_index "likes", ["likeable_id", "likeable_type"], name: "fk_likeables", using: :btree
  add_index "likes", ["liker_id", "liker_type"], name: "fk_likes", using: :btree

  create_table "link_previews", force: :cascade do |t|
    t.string   "url"
    t.string   "title"
    t.text     "description"
    t.string   "picture_url"
    t.string   "link_previewable_type"
    t.integer  "link_previewable_id"
    t.datetime "created_at",            null: false
    t.datetime "updated_at",            null: false
  end

  create_table "media", force: :cascade do |t|
    t.string   "title"
    t.integer  "user_id"
    t.integer  "album_id"
    t.string   "attachmentable_type"
    t.integer  "attachmentable_id"
    t.string   "mediable_type"
    t.integer  "mediable_id"
    t.datetime "created_at",                      null: false
    t.datetime "updated_at",                      null: false
    t.integer  "likers_count",        default: 0
  end

  add_index "media", ["album_id"], name: "index_media_on_album_id", using: :btree
  add_index "media", ["user_id"], name: "index_media_on_user_id", using: :btree

  create_table "notes", force: :cascade do |t|
    t.text     "text"
    t.integer  "user_id"
    t.boolean  "private",      default: true
    t.integer  "likers_count", default: 0
    t.datetime "created_at",                  null: false
    t.datetime "updated_at",                  null: false
  end

  create_table "notifications", force: :cascade do |t|
    t.string   "name"
    t.datetime "read_at"
    t.integer  "user_id"
    t.string   "initiator_type"
    t.integer  "initiator_id"
    t.hstore   "extra_data"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
    t.string   "object_type"
    t.integer  "object_id"
  end

  create_table "online_times", force: :cascade do |t|
    t.integer "average_session_time"
    t.integer "session_count"
  end

  create_table "ratings", force: :cascade do |t|
    t.integer  "value",           default: 0, null: false
    t.integer  "user_id"
    t.integer  "ratingable_id"
    t.string   "ratingable_type"
    t.datetime "created_at",                  null: false
    t.datetime "updated_at",                  null: false
  end

  create_table "shared_docs", force: :cascade do |t|
    t.integer  "owner_id"
    t.integer  "bubble_id"
    t.string   "doc_id_external"
    t.datetime "created_at",                   null: false
    t.datetime "updated_at",                   null: false
    t.string   "title",           default: ""
  end

  create_table "suggestions", force: :cascade do |t|
    t.string   "keyword"
    t.integer  "freq",       default: 0
    t.datetime "created_at",             null: false
    t.datetime "updated_at",             null: false
  end

  add_index "suggestions", ["keyword"], name: "index_suggestions_on_keyword", unique: true, using: :btree

  create_table "uploaded_files", force: :cascade do |t|
    t.integer  "owner_id"
    t.integer  "bubble_id"
    t.string   "url"
    t.integer  "downloads"
    t.datetime "created_at"
    t.string   "file"
    t.string   "content_type"
    t.integer  "size"
  end

  create_table "user_attendances", force: :cascade do |t|
    t.integer  "user_id"
    t.datetime "latest_date"
    t.string   "url"
    t.string   "section"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  create_table "user_interests", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "interest_id"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
  end

  add_index "user_interests", ["interest_id"], name: "index_user_interests_on_interest_id", using: :btree
  add_index "user_interests", ["user_id"], name: "index_user_interests_on_user_id", using: :btree

  create_table "users", force: :cascade do |t|
    t.string   "email",                  default: "",    null: false
    t.string   "encrypted_password",     default: "",    null: false
    t.string   "username"
    t.string   "first_name"
    t.integer  "gender"
    t.string   "zip_code"
    t.string   "phone"
    t.date     "birthday"
    t.string   "language"
    t.string   "description"
    t.datetime "last_ping_date"
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.integer  "sign_in_count",          default: 0,     null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.inet     "current_sign_in_ip"
    t.inet     "last_sign_in_ip"
    t.string   "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string   "unconfirmed_email"
    t.datetime "created_at",                             null: false
    t.datetime "updated_at",                             null: false
    t.integer  "default_avatar_id"
    t.float    "latitude"
    t.float    "longitude"
    t.string   "cover_image"
    t.integer  "likees_count",           default: 0
    t.integer  "interests_count",        default: 0,     null: false
    t.integer  "bubbles_count",          default: 0,     null: false
    t.boolean  "completed",              default: false, null: false
    t.integer  "user_invites_count",     default: 0,     null: false
    t.integer  "admin",                  default: 0
  end

  add_index "users", ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true, using: :btree
  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree
  add_index "users", ["latitude", "longitude"], name: "index_users_on_latitude_and_longitude", using: :btree
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true, using: :btree

  create_table "visits", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "visitable_id"
    t.string   "visitable_type"
    t.datetime "created_at",     null: false
  end

  create_table "wheel_chat_chats", force: :cascade do |t|
    t.string   "channel_name"
    t.datetime "created_at",                   null: false
    t.datetime "updated_at",                   null: false
    t.boolean  "mute",         default: false
  end

  create_table "wheel_chat_messages", force: :cascade do |t|
    t.text     "text"
    t.integer  "user_id"
    t.integer  "chat_id"
    t.string   "video_url"
    t.datetime "created_at",  null: false
    t.datetime "updated_at",  null: false
    t.integer  "receiver_id"
    t.datetime "read_at"
  end

  create_table "wheel_chat_notifications", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "initiator_id"
    t.string   "channel_name"
    t.datetime "created_at",   null: false
    t.datetime "updated_at",   null: false
  end

  create_table "widgets", force: :cascade do |t|
    t.string   "widgetable_type"
    t.integer  "widgetable_id"
    t.integer  "bubble_id"
    t.datetime "created_at",                     null: false
    t.datetime "updated_at",                     null: false
    t.boolean  "enabled",         default: true, null: false
  end

  add_foreign_key "activities", "users"
  add_foreign_key "albums", "users"
  add_foreign_key "bubble_interests", "bubbles"
  add_foreign_key "bubble_interests", "interests"
  add_foreign_key "bubble_invitations", "bubbles"
  add_foreign_key "bubble_members", "bubbles"
  add_foreign_key "bubble_members", "users"
  add_foreign_key "identities", "users"
  add_foreign_key "media", "albums"
  add_foreign_key "media", "users"
  add_foreign_key "user_interests", "interests"
  add_foreign_key "user_interests", "users"
end
