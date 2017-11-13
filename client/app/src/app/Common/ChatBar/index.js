/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import { notify } from 'react-notify-toast';
import FlatButton from 'material-ui/FlatButton';
import IconActionSearch from 'material-ui/svg-icons/action/search';
import IconContentAdd from 'material-ui/svg-icons/content/add-circle-outline';
import { Scrollbars } from 'react-custom-scrollbars';
import Dialog from 'material-ui/Dialog';
import CreateOrUpdateBubble from '@common/CreateOrUpdateBubble';
import ChatSearch from '@common/ChatSearch';
import ChatBox from '@common/ChatBox';
import BubblesMenu from '@dashboard/components/BubblesMenu';
import CommonStyles from '@utils/CommonStyles';
import { withRouter } from 'react-router';

import FloatingActionButton from 'material-ui/FloatingActionButton';
import Chat from 'material-ui/svg-icons/communication/chat';

import graph from 'fb-react-sdk';
import superagent from 'superagent';
import { getQueryStringValue } from '@utils/urlHelpers';

const fbApiKey = document.getElementsByName('facebook-api-key')[0].content;

import hoc from './hoc';
const soundElements = [
  '/assets/new_notif.ogg',
];
const music = new Audio(soundElements[0]);
music.load();

class ChatBar extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      keywordSearch: '',
      allBubbles: false,
      showBubbleSearch: true,
      openCreateBubbles: false,
      bubbleCounters: {},
      refetchBubbles: false,
      searchOpen: false,
      initUser: {},
      user_avatar: '',
      keyword: '',
      playSound: false,
      friends: [],
      fbDialogOpen: false,
      fbRequestUrl: '',
    };

    this.isSmallScreen = false;
    // favicount.configure('height', 10).configure('background', '#F1713A');
    // this.props.setUnreadInitial(friend.node.wheel_chat_missed_messages_count, friend.node.id)

  }

  componentWillMount() {
    this.updateScreen();
  }

  componentDidMount() {
    $(window).on('resize', this.forceUpdateScreen);
    this.checkForInvitingFBFriends();
  }

  componentWillReceiveProps(nextProps) {
    const { currentUser } = nextProps.data;
    const newFriends = currentUser && currentUser.friends ? currentUser.friends.edges.slice(0) : [];
    const friends = this.state.friends.slice(0);

    if (newFriends.length > friends.length) {
      this.setState({
        friends: [],
      });
    }
    else {
      // keep order from friend state, use new objects from newly loaded props
      const reconstructedFriends = [];
      for (let i = 0; i < friends.length; i++) {
        const friendId = friends[i].node.id;
        for (let j = 0; j < newFriends.length; j++) {
          if (newFriends[j].node.id == friendId) {
            reconstructedFriends.push(newFriends.splice(j, 1)[0]);
            break;
          }
        }
        if (!newFriends.length) {
          break;
        }
      }
      while (newFriends.length > 0) {
        reconstructedFriends.push(newFriends.pop());
      }
      this.setState({
        friends: reconstructedFriends,
      });
    }
  }

  componentDidUpdate() {
    this.listenPusher();
  }

  componentWillUnmount() {
    this.unlistenPusher();
    $(window).off('resize', this.forceUpdateScreen);
  }

  forceUpdateScreen = () => {
    this.updateScreen();
    this.forceUpdate();
  }

  handleDialogCreateBubbleOpen = () => {
    this.setState({
      openCreateBubbles: true,
    });
  };

  handleDialogCreateBubbleClose = (path) => {
    this.props.router.push(path);
    this.setState({
      openCreateBubbles: false,
    });
  };

  toggleBubbleSearch = (search) => {
    this.setState({
      showBubbleSearch: search,
    });
  }

  refetchBubbles = () => {
    this.setState({
      refetchBubbles: true,
    });
  }

  stopRefetchBubbles = () => {
    this.setState({
      refetchBubbles: false,
    });
  }

  listenPusher = () => {
    const self = this;
    if (this.pusherChannelOpened) {
      return;
    }
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    const pusher = this.context.pusher;
    let channelD = pusher.channels.channels[`private-dashboard-${currentUser.id}`];
    if (!channelD) {
      channelD = pusher.subscribe(`private-dashboard-${currentUser.id}`);
    }

    channelD.bind('total_unread_items_count_changed', (data) => {
      const _bubbleCounters = self.state.bubbleCounters;
      const bubbleCounters = { ..._bubbleCounters };
      bubbleCounters[data.bubble.id] = data.total_unread_items_count;
      self.setState({ bubbleCounters });
    });

    this.pusherChannelOpened = true;
    const channel = this.context.userChannel;
    channel.bind('important', this.refresh);
    channel.bind('avatar_changed', this.handleAvatarChanged);
    channel.bind('friend_avatar_changed', this.handleFriendAvatarChanged);
    channel.bind('user_joined_bubble', this.handleUserJoinBubble);
    channel.bind('user_left_bubble', this.handleUserLeftBubble);
  }

  unlistenPusher = () => {
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    this.pusherChannelOpened = false;
    const channel = this.context.userChannel;
    channel.unbind('important', this.refresh);
    channel.unbind('avatar_changed', this.handleAvatarChanged);
    channel.unbind('friend_avatar_changed', this.handleFriendAvatarChanged);
    channel.unbind('user_joined_bubble');
    channel.unbind('user_left_bubble');

    const pusher = this.context.pusher;
    const channelD = pusher.channels.channels[`private-dashboard-${currentUser.id}`];
    if (channelD) {
      channelD.unbind('total_unread_items_count_changed');
    }
  }

  refresh = (data) => {
    if (data.message === 'need_to_reload_notifications') {
      this.props.data.refetch();
    }
  }

  handleUserJoinBubble = (data) => {
    this.setState({
      refetchBubbles: true,
    });
  }

  handleUserLeftBubble = (data) => {
    this.setState({
      refetchBubbles: true,
    });
  }

  handleAvatarChanged = (data) => {
    const newObj = {};
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    newObj['user_avatar_' + user.username] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  handleFriendAvatarChanged = (data) => {
    const newObj = {};
    newObj['user_avatar_' + data.user_data.username] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  updateScreen = () => {
    this.isSmallScreen = ($(window).width() < 768);
  }

  handleToggle = () => this.setState({ open: !this.state.open });

  handleClose = () => this.setState({ open: false });

  onToggleSearch = () => {
    const { searchOpen } = this.state;
    this.setState({
      searchOpen: !searchOpen,
    });
  }

  onKeywordChange = (keyword) => {
    this.setState({
      keyword: keyword,
    });
  }

  onSelectFriend = (friendId, channelName) => {
    const { open } = this.state;
    this.setState({
      open: !open,
      searchOpen: false,
    });
    this.props.clearUnreadCount({ variables: { channelName: channelName } });
    if (this.props.onOpenChatbox) {
      this.props.onOpenChatbox(friendId);
    }
  }

  onCloseSearch = () => {
    const { searchOpen } = this.state;
    this.setState({
      searchOpen: false,
    });
  }

  onCloseChatbox = (friendId, e) => {
    e.stopPropagation();

    if (this.props.onCloseChatbox) {
      this.props.onCloseChatbox(friendId);
    }
  }

  onMessageReceived = (username, friendId, playSound) => {
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    if (this.props.onIncUnreadMsgCount && username !== user.username) {
      const { chatboxOpenStatuses, chatboxMinimizeStatuses } = this.props;

      this.props.onIncUnreadMsgCount(friendId, chatboxMinimizeStatuses[friendId]);

      const closed = chatboxOpenStatuses[friendId] !== undefined ? !chatboxOpenStatuses[friendId] : true;
      const minimized = chatboxMinimizeStatuses[friendId] !== undefined ? chatboxMinimizeStatuses[friendId] : true;

      // most recently message received avatar to top
      const friendsInit = this.getFriends();
      const friends = JSON.parse(JSON.stringify(friendsInit));
      let messageSentFriends = null;
      for (let i = 0; i < friends.length; i++) {
        if (friends[i].node.id == friendId) {
          messageSentFriends = friends.splice(i, 1);
          break;
        }
      }
      if (messageSentFriends) {
        friends.splice(0, 0, messageSentFriends[0]);
      }

      if (closed || minimized) {
        this.setState({
          friends,
          playSound: true,
        });

        this.notifSound();

        setTimeout(() => {
          this.setState({
            playSound: false,
          });
        }, 1000);
      }
      else {
        this.setState({
          friends,
        });
      }
    }
  }

  getFriends = () => {
    const { friends } = this.state;
    if (friends.length) {
      return friends;
    }
    const { currentUser } = this.props.data;
    return currentUser && currentUser.friends ? currentUser.friends.edges : [];
  }

  getFriendsSorted = () => {
    const friendsInit = this.getFriends();
    const friends = JSON.parse(JSON.stringify(friendsInit));
    const _clonedFriends = [];
    for (let i = 0; i < friends.length; i++) {
      _clonedFriends.push(friends[i]);
    }
    _clonedFriends.sort((friend1, friend2) => {
      const id1 = parseInt(friend1.node.id);
      const id2 = parseInt(friend2.node.id);
      if (id1 === id2) {
        return 0;
      }
      else if (id1 > id2) {
        return 1;
      }
      else {
        return -1;
      }
    });
    return _clonedFriends;
  }

  onMessageSent = (friendId) => {
    const friendsInit = this.getFriends();
    const friends = JSON.parse(JSON.stringify(friendsInit));
    let messageSentFriends = null;
    for (let i = 0; i < friends.length; i++) {
      if (friends[i].node.id == friendId) {
        messageSentFriends = friends.splice(i, 1);
        break;
      }
    }
    if (messageSentFriends) {
      friends.splice(0, 0, messageSentFriends[0]);
    }
    this.setState({
      friends,
    });
  }

  notifSound = () => {
    music.play();
  }

  facebookRedirectBackUri = () => {
    return window.location.protocol + '//' + window.location.host + '/';
  }

  handleClickInviteFBFriends = () => {
    graph.setVersion('2.8');
    const authUrl = graph.getOauthUrl({
      client_id: fbApiKey,
      redirect_uri: this.facebookRedirectBackUri(),
    });
    window.location.href = authUrl;
  }

  checkForInvitingFBFriends = () => {
    const code = getQueryStringValue(window.location.search, 'code');
    if (code) {

      const data = {
        code,
        callback_url: this.facebookRedirectBackUri(),
      };
      const request = superagent.post('/api/v1/fb-authorize');
      const token = window.localStorage.getItem('mbubblz_token');
      const clientID = window.localStorage.getItem('mbubblz_client_id');
      request.set('Accept', 'application/json');
      request.set('Content-Type', 'application/json');
      request.set('authorization', token);
      request.set('Client-ID', clientID);
      request.send(data);
      request.end((err, res) => {
        if (err) {
          notify.show('Failed to authorize in Facebook', 'error', 2000);
        }
        else {
          if (res.body.access_token) {
            const message = 'Try%20MyBubblz!%20You%27ll%20like%20it!';
            const fbRequestUrl = `https://www.facebook.com/dialog/apprequests?access_token=${res.body.access_token}&app_id=${fbApiKey}&redirect_uri=${this.facebookRedirectBackUri()}&message=${message}&display=iframe`;
            this.setState({
              fbDialogOpen: true,
              fbRequestUrl,
            });
          }
        }
      });
    }
  }

  handleOnIframeLoad = () => {
    setTimeout(() => {
      try {
        const currentiFrameUrl = this.refs.fbIframe.contentWindow.location.href;
        this.setState({
          fbDialogOpen: false,
          fbRequestUrl: '',
        });
      } catch (e) {
      }
    });
  }

  render() {
    if (this.props.data.loading) {
      return <div>
        Chatbar loading...
      </div>;
    }
    const searchIconStyle = {
      width: 22,
      height: 22,
    };
    const fbIframeBgStyle = {
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
    };
    const fbIframeWrapperStyle = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 600,
      height: 500,
      marginLeft: -300,
      marginTop: -250,
      border: '6px solid rgba(255, 255, 255, 0.2)',
    };
    const fbIframeStyle = {
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
    };

    const { searchOpen, keyword, keywordSearch, allBubbles, fbDialogOpen, fbRequestUrl } = this.state;
    const { currentUser } = this.props.data;

    const friendsListForChatBoxesArray = this.getFriendsSorted();
    const userId = currentUser ? currentUser.id : 0;
    const username = currentUser ? currentUser.username : '';
    const { unreadMessageCount, chatboxOpenStatuses, chatboxMinimizeStatuses } = this.props;
    const onlineUsers = JSON.parse(this.props.onlineUsers);
    const _friendsInit = this.getFriends();
    const friends = JSON.parse(JSON.stringify(_friendsInit));

    friends.sort((friend1, friend2) => {
      const online1 = onlineUsers[parseInt(friend1.node.id)];
      const online2 = onlineUsers[parseInt(friend2.node.id)];
      if (online1 && !online2) {
        return -1;
      }
      else if (!online1 && online2) {
        return 1;
      }
      else if (online1 && online2 && !online1.idle && online2.idle) {
        return 1;
      }
      else if (online1 && online2 && online1.idle && !online2.idle) {
        return -1;
      }
      else if (friend1.node.wheel_chat_missed_messages_count > friend2.node.wheel_chat_missed_messages_count) {
        return -1;
      }
      else if (friend1.node.wheel_chat_missed_messages_count < friend2.node.wheel_chat_missed_messages_count) {
        return 1;
      }
      else if (friend1.node.username < friend2.node.username) {
        return -1;
      }
      else if (friend1.node.username > friend2.node.username) {
        return 1;
      }
      else {
        return 0;
      }
    });

    let commonUnreadMsgs = 0;
    friends.map((friend) => {
      let unreadMsgCount = '';
      if (typeof unreadMessageCount[friend.node.id] === 'undefined') {
        unreadMsgCount = friend.node.wheel_chat_missed_messages_count;
      }
      else {
        unreadMsgCount = unreadMessageCount[friend.node.id];
      }
      commonUnreadMsgs = commonUnreadMsgs + unreadMsgCount;
    });

    return (
      <div>
      { !this.isSmallScreen ?
          <div className='myb-chatbar'>
          <div className='myb-chatbar-content'>
            <FlatButton
              className="fb-invite-button"
              label="Invite Friends"
              primary={true}
              backgroundColor={CommonStyles.outside.buttonBackgroundColor}
              hoverColor={CommonStyles.outside.buttonHoverColor}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  version="1.1" baseProfile="full"
                  width="20" height="20" viewBox="0 0 24.00 24.00"
                  enableBackground="new 0 0 24.00 24.00" xmlSpace="preserve">
                  <path
                    fill="#ffffff" fillOpacity="1"
                    strokeWidth="0.2" strokeLinejoin="round"
                    d="M 18.9994,3.99807L 18.9994,6.99807L 16.9994,6.99807C 16.4474,6.99807 15.9994,7.44507 15.9994,7.99807L 15.9994,9.99807L 18.9994,9.99807L 18.9994,12.9981L 15.9994,12.9981L 15.9994,19.9981L 12.9994,19.9981L 12.9994,12.9981L 10.9994,12.9981L 10.9994,9.99807L 12.9994,9.99807L 12.9994,7.49807C 12.9994,5.56407 14.5664,3.99807 16.4994,3.99807M 19.9994,1.99807L 3.99939,1.99807C 2.89539,1.99807 2.0094,2.89306 2.0094,3.99807L 1.99939,19.9981C 1.99939,21.1016 2.89539,21.9981 3.99939,21.9981L 19.9994,21.9981C 21.1034,21.9981 21.9994,21.1016 21.9994,19.9981L 21.9994,3.99807C 21.9994,2.89306 21.1034,1.99807 19.9994,1.99807 Z "/>
                </svg>
              }
              labelStyle={{
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 400,
              }}
              onClick={this.handleClickInviteFBFriends}
            />
            <div className='chatbar-users'>
              <div className='leftbar-title'>Chat</div>
              <Scrollbars
                className='custom-scrollbars'
                autoHide
                autoHideTimeout={1000}
                autoHideDuration={200}
                autoHeight
                autoHeightMin={52}
                autoHeightMax={228}
              >
              {friends.length > 0 ?
                friends.map((friend, index) => {
                  let unreadMsgCount = '';
                  if (typeof unreadMessageCount[friend.node.id] === 'undefined') {
                    unreadMsgCount = friend.node.wheel_chat_missed_messages_count;
                  }
                  else {
                    unreadMsgCount = unreadMessageCount[friend.node.id];
                  }
                  const friendId = friend.node.id;
                  const channelName = parseInt(userId) < parseInt(friendId) ? `${userId}_${friendId}` : `${friendId}_${userId}`;
                  const friendAvatar = this.state['user_avatar_' + friend.node.username] ? this.state['user_avatar_' + friend.node.username] : friend.node.avatar_url;
                  return (
                    <a key={index} href='javascript:void(0)' className='chatbar-user' onClick={this.onSelectFriend.bind(this, friendId, channelName)}>
                      <span className='image-wrapper'>
                        <img src={friendAvatar} />
                        {
                          onlineUsers[parseInt(friend.node.id)] ?
                          <span className={'online-status' + (onlineUsers[parseInt(friend.node.id)].idle ? ' idle' : '')} />
                          :
                          <span className='online-status offline' />
                        }
                        {
                          chatboxOpenStatuses[friend.node.id] && !chatboxMinimizeStatuses[friend.node.id] ?
                          ''
                          :
                          (
                            unreadMsgCount ?
                            <span className='counter'>{unreadMsgCount}</span>
                            :
                            ''
                          )
                        }
                      </span>
                      <span className='first-name'>{friend.node.first_name}</span>
                    </a>
                  );
                })
                :
                <div className='no-bubbles'>You dont have friends yet</div>
              }
              </Scrollbars>
              <a href='javascript:void(0)' className='chatbar-search' onClick={this.onToggleSearch}>
                <IconActionSearch color='#b1b8c0' style={searchIconStyle} />
              </a>
            </div>

            <div className='myb-feed-types bubbles'>
              <div className='leftbar-title'>
                Bubbles
                {
                  this.state.allBubbles ?
                    ''
                  :
                    <Link
                      to='/mybubbles'
                      className='view-all'
                    >
                      view all
                    </Link>
                }
              </div>

              <a className='myb-feed' style={{ paddingTop: 0 }} onClick={this.handleDialogCreateBubbleOpen}>
                <IconContentAdd style={CommonStyles.dashBubblesMenu.addBubbleIconStyle} />
                <span className='myb-feed-label' style={{ marginLeft: '14px' }}>Add bubble</span>
              </a>

              <Dialog
                title='Create Bubble'
                modal={false}
                open={this.state.openCreateBubbles}
                onRequestClose={this.handleDialogCreateBubbleClose}
                autoScrollBodyContent
                contentStyle={{ ...CommonStyles.dialog.content, width: '30%' }}
                bodyStyle={CommonStyles.dialog.body}
                titleStyle={CommonStyles.dialog.title}
                overlayStyle={CommonStyles.dialog.overlay}
              >
                <CreateOrUpdateBubble
                  closeDialog={this.handleDialogCreateBubbleClose}
                  refetchBubbles={this.refetchBubbles}
                />
              </Dialog>

              {/* this.state.showBubbleSearch || this.state.keywordSearch !== '' ?
                <SearchBubbles onSearch={(newKeyword) => {
                  if (keywordSearch !== newKeyword) {
                    this.setState({ keywordSearch: newKeyword, allBubbles: false });
                  }
                }}
                />
                :
                null
              */}

              <Scrollbars
                className='custom-scrollbars'
                autoHide
                autoHideTimeout={1000}
                autoHideDuration={200}
                autoHeight
                autoHeightMin={52}
                autoHeightMax={156}
              >
                <BubblesMenu
                  keyword={keywordSearch}
                  allBubbles={allBubbles}
                  bubbleCounters={this.state.bubbleCounters}
                  toggleBubbleSearch={this.toggleBubbleSearch}
                  refetchBubbles={this.state.refetchBubbles}
                  stopRefetchBubbles={this.stopRefetchBubbles}
                />
              </Scrollbars>
            </div>

          </div>
          <div className='myb-chatbox-container'>
            <ChatSearch
              open={searchOpen}
              keyword={keyword}
              onKeywordChange={this.onKeywordChange}
              onSelectFriend={this.onSelectFriend}
              onClose={this.onCloseSearch} />
            {friendsListForChatBoxesArray.map((friend) => {
              const friendId = friend.node.id;
              const channelName = parseInt(userId) < parseInt(friendId) ? `${userId}_${friendId}` : `${friendId}_${userId}`;
              const friendAvatar = this.state['user_avatar_' + friend.node.username] ? this.state['user_avatar_' + friend.node.username] : friend.node.avatar_url;
              let unreadMsgCount = '';
              if (typeof unreadMessageCount[friend.node.id] === 'undefined') {
                unreadMsgCount = friend.node.wheel_chat_missed_messages_count;
              }
              else {
                unreadMsgCount = unreadMessageCount[friend.node.id];
              }
              return (
                <ChatBox
                  key={channelName}
                  open={chatboxOpenStatuses[friendId]}
                  channelName={channelName}
                  friend={friend.node}
                  friendAvatar={friendAvatar}
                  minimized={chatboxMinimizeStatuses[friendId]}
                  playSound={this.state.playSound}
                  unreadMsgCount={unreadMsgCount}
                  onToggleMinimize={this.props.onToggleMinimize.bind(this, friendId, channelName)}
                  onClose={this.onCloseChatbox.bind(this, friendId)}
                  onMessageSent={this.onMessageSent}
                  onMessageReceived={this.onMessageReceived}
                  onlineUsers={onlineUsers}
                />
              );
            })}
          </div>
        </div>
      :
      <div style={{ position: 'fixed', zIndex: 1, right: 16, bottom: 16 }}>
        <FloatingActionButton href='/messages'>
          <Chat/>
        </FloatingActionButton>
        { commonUnreadMsgs > 0 ? <span className='common-unread-msgs'>{commonUnreadMsgs}</span> : null}
        <div style={{ display: 'none' }}>
          {friendsListForChatBoxesArray.map((friend) => {
            const friendId = friend.node.id;
            const channelName = parseInt(userId) < parseInt(friendId) ? `${userId}_${friendId}` : `${friendId}_${userId}`;
            const friendAvatar = this.state['user_avatar_' + friend.node.username] ? this.state['user_avatar_' + friend.node.username] : friend.node.avatar_url;
            let unreadMsgCount = '';
            if (typeof unreadMessageCount[friend.node.id] === 'undefined') {
              unreadMsgCount = friend.node.wheel_chat_missed_messages_count;
            }
            else {
              unreadMsgCount = unreadMessageCount[friend.node.id];
            }
            return (
              <ChatBox
                key={channelName}
                open={chatboxOpenStatuses[friendId]}
                channelName={channelName}
                friend={friend.node}
                friendAvatar={friendAvatar}
                minimized={chatboxMinimizeStatuses[friendId]}
                playSound={this.state.playSound}
                unreadMsgCount={unreadMsgCount}
                onToggleMinimize={this.props.onToggleMinimize.bind(this, friendId, channelName)}
                onClose={this.onCloseChatbox.bind(this, friendId)}
                onMessageSent={this.onMessageSent}
                onMessageReceived={this.onMessageReceived}
                onlineUsers={onlineUsers}
              />
            );
          })}
        </div>
      </div>
      }
      {
        fbDialogOpen && <div style={fbIframeBgStyle}>
          <div style={fbIframeWrapperStyle}>
            <iframe
              ref='fbIframe'
              src={fbRequestUrl}
              style={fbIframeStyle}
              onLoad={this.handleOnIframeLoad} />
          </div>
        </div>
      }
    </div>
    );
  }
}

export default withRouter(hoc(ChatBar));
