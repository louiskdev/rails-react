QueryType = GraphQL::ObjectType.define do
  name "Query"
  description "The query root for this schema"

  # Adding a Relay-compliant `node` field:
  # Used by Relay to lookup objects by UUID:
  field :node, GraphQL::Relay::Node.field
  # field :node, field: GraphQL::Relay::Node.field

  # Users namespace
  field :currentUser, field: Users::CurrentUserField
  field :user, field: Users::UserField
  field :interesting_users, field: Users::InterestingUsersField
  field :suggestUsers, field: Users::SuggestUsersField
  field :findUsers, field: Users::FindUsersField
  field :findUsersByKeyword, field: Users::FindUsersByKeywordField
  field :checkConfirmationToken, field: Users::CheckConfirmationTokenField
  field :checkUserByInvitationToken, field: Users::CheckUserByInvitationTokenField

  # Bubbles namespace
  field :bubble, field: Bubbles::BubbleField
  field :my_bubbles, field: Bubbles::MyBubblesField
  field :user_bubbles, field: Bubbles::UserBubblesField
  field :interesting_bubbles, field: Bubbles::InterestingBubblesField
  field :bubblesContainingMyMedia, field: Bubbles::BubblesContainingMyMediaField
  field :suggestBubbles, field: Bubbles::SuggestBubblesField
  field :findBubbles, field: Bubbles::FindBubblesField
  field :availableWidgets, field: Bubbles::AvailableWidgetsField
  field :bubbleMembers, field: Bubbles::BubbleMembersField
  field :bubbleCounters, field: Bubbles::BubbleCountersField
  field :bubbleInvitableUsers, field: Bubbles::BubbleInvitableUsersField

  # Media namespace
  field :medium, field: Media::MediumField
  field :myGalleryAllMedia, field: Media::MyGalleryAllMediaField
  field :userGalleryAllMedia, field: Media::UserGalleryAllMediaField
  field :videoUploadingProgress, field: Media::VideoUploadingProgressField

  # Albums namespace
  field :myGalleryAlbums, field: Albums::MyGalleryAlbumsField
  field :userGalleryAlbums, field: Albums::UserGalleryAlbumsField
  field :galleryWidgetAlbums, field: Albums::GalleryWidgetAlbumsField

  # Notes namespace
  field :note, field: Notes::NoteField

  # Activities namespace
  field :activity, field: Activities::ActivityField

  # Feeds namespace
  field :my_feed, field: Feeds::MyFeedField
  field :my_feed_mobile, field: Feeds::MyFeedMobileField
  field :friends_feed, field: Feeds::FriendsFeedField
  field :user_feed, field: Feeds::UserFeedField
  field :bubble_feed, field: Feeds::BubbleFeedField
  field :hashtag_feed, field: Feeds::HashtagFeedField
  field :hidden_posts_count, field: Feeds::HiddenPostsCountField

  connection :popular_interests, InterestType.connection_type, 'Get list of popular interests' do
    resolve -> (obj, args, ctx) { Interest.order(counter: :desc) }
  end

  # Comments namespace
  field :comment, field: Comments::CommentField
  field :commentRelatedInformation, field: Comments::CommentRelatedInformationField
  field :rootCommentsForObject, field: Comments::RootCommentsForObjectField

  # PreviewLinks namespace
  field :linkPreviewData, field: LinkPreviews::LinkPreviewDataField

  # Suggestions namespace
  field :suggestions, field: Suggestions::SuggestionsField

  # Notifications namespace
  field :myNotifications, field: Notifications::MyNotificationsField
  field :myActionNotifications, field: Notifications::MyActionNotificationsField

  # WheelChat namespace
  field :wheelchat, field: WheelChat::ChatField

  # Events namespace
  field :myEvents, field: Events::MyEventsField

  # Widgets::Chat namespace
  field :chat_widget, field: Widgets::Chat::ChatField
  field :chat_widget_channel, field: Widgets::Chat::ChannelField

  # Widgets::Blog namespace
  field :postsFromBlog, field: Widgets::Blog::PostsFromBlogField
  field :postFromBlog, field: Widgets::Blog::PostFromBlogField

  # Widgets::Gallery namespace
  field :mediaFromGallery, field: Widgets::Gallery::MediaFromGalleryField

  # Widgets::Events namespace
  field :eventsFromWidget, field: Widgets::Events::EventsFromWidgetField

  # Widgets::Files namespace
  field :uploadedFiles, field: Widgets::Files::UploadedFilesField
  field :sharedDocuments, field: Widgets::Files::SharedDocumentsField

  # Documents namespace
  field :document, field: Documents::DocumentField

  # Admin namespace
  field :adminUsers, field: Admin::AdminUsersField
  field :adminUsersJoinedCount, field: Admin::AdminUsersJoinedCountField
  field :adminBubbles, field: Admin::AdminBubblesField
  field :adminCommonKeywords, field: Admin::AdminCommonKeywordsField
  field :admins, field: Admin::AdminsField
  field :adminActiveUsers, field: Admin::AdminActiveUsersField
  field :adminZipCodesUsed, field: Admin::AdminZipCodesUsedField

  # Hashtags namespace
  field :trendingHashtags, field: Hashtags::TrendingHashtagsField

end
