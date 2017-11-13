MutationType = GraphQL::ObjectType.define do
  name "Mutation"
  description "The mutation root for this schema"

  # Users namespace
  field :signInUser, field: Users::SignInUserMutation.field
  field :signOutUser, field: Users::SignOutUserMutation.field
  field :sendConfirmationEmail, field: Users::SendConfirmationEmailMutation.field
  field :resendConfirmationEmail, field: Users::ResendConfirmationEmailMutation.field
  field :setUserDetails, field: Users::SetUserDetailsMutation.field
  field :completeAccount, field: Users::CompleteAccountMutation.field
  field :updatePassword, field: Users::UpdatePasswordMutation.field
  field :resetPasswordRequest, field: Users::ResetPasswordRequestMutation.field
  field :resetPasswordByToken, field: Users::ResetPasswordByTokenMutation.field
  field :changeUserInterests, field: Users::ChangeUserInterestsMutation.field
  field :changeUserAvatar, field: Users::ChangeUserAvatarMutation.field
  field :updateUser, field: Users::UpdateUserMutation.field

  # Bubbles namespace
  field :createBubble, field: Bubbles::CreateBubbleMutation.field
  field :updateBubble, field: Bubbles::UpdateBubbleMutation.field
  field :destroyBubble, field: Bubbles::DestroyBubbleMutation.field
  field :changeBubbleAvatar, field: Bubbles::ChangeBubbleAvatarMutation.field
  field :changeBubbleInterests, field: Bubbles::ChangeBubbleInterestsMutation.field
  field :sendBubbleInvitation, field: Bubbles::SendBubbleInvitationMutation.field
  field :acceptBubbleInvitation, field: Bubbles::AcceptBubbleInvitationMutation.field
  field :cancelBubbleInvitation, field: Bubbles::CancelBubbleInvitationMutation.field
  field :joinMeToBubble, field: Bubbles::JoinMeToBubbleMutation.field
  field :disjoinMeFromBubble, field: Bubbles::DisjoinMeFromBubbleMutation.field
  field :kickMemberFromBubble, field: Bubbles::KickMemberFromBubbleMutation.field
  field :changeMemberRoleInBubble, field: Bubbles::ChangeMemberRoleInBubbleMutation.field
  field :addWidget, field: Bubbles::AddWidgetMutation.field
  field :disableWidget, field: Bubbles::DisableWidgetMutation.field
  field :banMemberFromBubble, field: Bubbles::BanMemberFromBubbleMutation.field
  field :unbanMemberFromBubble, field: Bubbles::UnbanMemberFromBubbleMutation.field

  # Media namespace
  field :changeAlbum, field: Media::ChangeAlbumMutation.field
  field :createMedium, field: Media::CreateMediumMutation.field
  field :destroyMedium, field: Media::DestroyMediumMutation.field
  field :shareMedium, field: Media::ShareMediumMutation.field

  # Albums namespace
  field :createAlbum, field: Albums::CreateAlbumMutation.field
  field :updateAlbum, field: Albums::UpdateAlbumMutation.field
  field :destroyAlbum, field: Albums::DestroyAlbumMutation.field

  # Activities namespace
  field :hideActivity, field: Activities::HideActivityMutation.field
  field :undoHiddenActivity, field: Activities::UndoHiddenActivityMutation.field
  field :shareActivity, field: Activities::ShareActivityMutation.field
  field :destroySharedActivity, field: Activities::DestroySharedActivityMutation.field
  field :flagActivityAsFavorite, field: Activities::FlagActivityAsFavoriteMutation.field
  field :unflagActivityAsFavorite, field: Activities::UnflagActivityAsFavoriteMutation.field

  # Notes namespace
  field :createNote, field: Notes::CreateNoteMutation.field
  field :updateNote, field: Notes::UpdateNoteMutation.field
  field :destroyNote, field: Notes::DestroyNoteMutation.field

  # Likes namespace
  field :createLike, field: Likes::CreateLikeMutation.field
  field :destroyLike, field: Likes::DestroyLikeMutation.field

  # Comments namespace
  field :createComment, field: Comments::CreateCommentMutation.field
  field :updateComment, field: Comments::UpdateCommentMutation.field
  field :destroyComment, field: Comments::DestroyCommentMutation.field

  # Ratings namespace
  field :rateObject, field: Ratings::CreateRatingMutation.field

  # Notifications namespace
  field :destroyNotification, field: Notifications::DestroyNotificationMutation.field
  field :destroyAllNotifications, field: Notifications::DestroyAllNotificationsMutation.field
  field :touchNotification, field: Notifications::TouchNotificationMutation.field
  field :touchAllNotifications, field: Notifications::TouchAllNotificationsMutation.field
  field :touchAllActionNotifications, field: Notifications::TouchAllActionNotificationsMutation.field

  # Friendships namespace
  field :requestFriendship, field: Friendships::RequestFriendshipMutation.field
  field :approveFriendship, field: Friendships::ApproveFriendshipMutation.field
  field :declineFriendship, field: Friendships::DeclineFriendshipMutation.field
  field :blockFriendship, field: Friendships::BlockFriendshipMutation.field
  field :destroyFriendship, field: Friendships::DestroyFriendshipMutation.field

  # WheelChat namespace
  field :createWheelChatMessage, field: WheelChat::CreateWheelChatMessageMutation.field
  field :clearWheelChatNotifications, field: WheelChat::ClearWheelChatNotificationsMutation.field
  field :updateWheelChatSettings, field: WheelChat::UpdateWheelChatSettingsMutation.field
  field :destroyWheelChat, field: WheelChat::DestroyWheelChatMutation.field
  field :removeAttachmentFromWheelChatMessage, field: WheelChat::RemoveAttachmentFromWheelChatMessageMutation.field
  field :readWheelChatMessage, field: WheelChat::ReadWheelChatMessageMutation.field

  # Widgets::Chat namespace
  field :createChatMessage, field: Widgets::Chat::CreateChatMessageMutation.field
  field :removeAttachmentFromChatMessage, field: Widgets::Chat::RemoveAttachmentFromChatMessageMutation.field
  field :createChatChannel, field: Widgets::Chat::CreateChatChannelMutation.field
  field :renameChatChannel, field: Widgets::Chat::RenameChatChannelMutation.field
  field :removeChatChannel, field: Widgets::Chat::RemoveChatChannelMutation.field
  field :addUserToPrivateChannel, field: Widgets::Chat::AddUserToPrivateChannelMutation.field

  # Widgets::Blog namespace
  field :createBlogPost, field: Widgets::Blog::CreateBlogPostMutation.field
  field :updateBlogPost, field: Widgets::Blog::UpdateBlogPostMutation.field
  field :destroyBlogPost, field: Widgets::Blog::DestroyBlogPostMutation.field

  # Widgets::Files namespace
  field :countDownload, field: Widgets::Files::CountDownloadMutation.field
  field :deleteFile, field: Widgets::Files::DeleteFileMutation.field

  # Events namespace
  field :createEvent, field: Events::CreateEventMutation.field
  field :joinEvent, field: Events::JoinEventMutation.field
  field :disjoinEvent, field: Events::DisjoinEventMutation.field

  # Call namespace
  field :initiateCall, field: Call::InitiateCallMutation.field
  field :rejectCall, field: Call::RejectCallMutation.field
  field :inviteIntoCall, field: Call::InviteIntoCallMutation.field
  field :initiateGroupCall, field: Call::InitiateGroupCallMutation.field

  # without namespace
  field :setLastVisitDate, field: SetLastVisitDateMutation.field

  # Admin namespace
  field :changePermission, field: Admin::ChangePermissionMutation.field
  field :sendMassEmail, field: Admin::SendMassEmailMutation.field

  # Statistics namespace
  field :reportOnlineTime, field: Statistics::ReportOnlineTimeMutation.field

  # Documents namespace
  field :createDocument, field: Documents::CreateDocumentMutation.field
  field :updateDocument, field: Documents::UpdateDocumentMutation.field
  field :deleteDocument, field: Documents::DeleteDocumentMutation.field

end
