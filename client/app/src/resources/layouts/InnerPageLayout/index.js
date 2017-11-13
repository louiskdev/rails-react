/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import Notifications from 'react-notify-toast';
import Helmet from 'react-helmet';
import Pusher from 'pusher-js';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Snackbar from 'material-ui/Snackbar';

import ChatBar from '@common/ChatBar';
import FeedbackForm from '@common/FeedbackForm';
import HeaderSigned from '../../components/HeaderSigned';
import CallConnectionManager from '../../components/CallConnectionManager';
import IdleStatusChecker from '../../components/IdleStatusChecker';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class InnerPageLayout extends Component {

  static childContextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
    globalChannel: React.PropTypes.object,
    privateGlobalChannel: React.PropTypes.object,
    chatFunctions: React.PropTypes.object,
    callFunctions: React.PropTypes.object,
  };

  state = {
    onlineUsers: JSON.stringify({}),
    unreadMessageCount: {},
    __need_for_updating: 0,
    chatboxOpenStatuses: {},
    chatboxMinimizeStatuses: {},
    openMessageFriendId: 0,
    openFeedbackDialog: false,
    showUpdateNotice: false,
    searchKeyword: '',
  }

  getChildContext = () => {
    return {
      pusher: this.pusher,
      userChannel: this.userChannel,
      globalChannel: this.globalChannel,
      privateGlobalChannel: this.privateGlobalChannel,
      chatFunctions: {
        onResetUnreadMsgCount: this.onResetUnreadMsgCount,
        onIncUnreadMsgCount: this.onIncUnreadMsgCount,
        setUnreadInitial: this.setUnreadInitial,
        onOpenChatbox: this.onOpenChatbox,
        onCloseChatbox: this.onCloseChatbox,
        getChatState: this.getChatState,
        setChatState: this.setChatState,
        addChatUpdateComponent: this.addChatUpdateComponent,
        removeChatUpdateComponent: this.removeChatUpdateComponent,
        onOpenMessage: this.onOpenMessage,
        onCloseMessage: this.onCloseMessage,
      },
      // callFunctions: this.callFunctions,
      callFunctions: {
        startDirectCall: this.startDirectCall,
        startDirectVideoCall: this.startDirectVideoCall,
        startGroupCall: this.startGroupCall,
      },
    };
  }

  constructor(props) {
    super(props);

    this.chatUpdateComponents = [];
    this.loggedInMoment = 0;
    this.idleStartTime = 0;

    this.callFunctions = {};

    this.initPusher();
  }

  registerCallFunctions = (callFunctions) => {
    this.callFunctions = callFunctions;
  }

  startDirectCall = (receiverId, receiverName, receiverAvatar) => {
    const { startDirectCall } = this.callFunctions;
    if (startDirectCall) {
      startDirectCall(receiverId, receiverName, receiverAvatar);
    }
  }

  startDirectVideoCall = (receiverId, receiverName, receiverAvatar) => {
    const { startDirectVideoCall } = this.callFunctions;
    if (startDirectVideoCall) {
      startDirectVideoCall(receiverId, receiverName, receiverAvatar);
    }
  }

  startGroupCall = (bubbleId, bubbleName, bubbleAvatar) => {
    const { startGroupCall } = this.callFunctions;
    if (startGroupCall) {
      startGroupCall(bubbleId, bubbleName, bubbleAvatar);
    }
  }

  initPusher = () => {
    const userInit = window.localStorage.getItem('mbubblz_token') || window.localStorage.getItem('mbubblz_client_id');
    if (!userInit) {
      return;
    }
    const pusherAppKey = document.getElementsByName('pusher-app-key')[0].content;
    const pusherAppCluster = document.getElementsByName('pusher-app-cluster')[0].content;
    const csrfToken = document.getElementsByName('csrf-token')[0].content;
    const authToken = window.localStorage ? window.localStorage.getItem('mbubblz_token') : '';
    const clientID = window.localStorage ? window.localStorage.getItem('mbubblz_client_id') : '';
    if (!authToken) {
      console.error('Authentication Token not found');
      return;
    }
    if (!clientID) {
      console.error('Device client ID not found');
      return;
    }
    this.pusher = new Pusher(pusherAppKey, {
      cluster: pusherAppCluster,
      authEndpoint: '/api/v1/pusher/auth',
      auth: {
        headers: {
          'X-CSRF-Token': csrfToken,
          'Authorization': authToken,
          'Client-ID': clientID,
        },
      },
    });
    this.reconnectTimer = null;
    this.checkPusherConnectionTimer = setInterval(this.checkPusherConnection, 600000);
    this.checkPusherConnectionCounter = 0;
    this.bindPusherStateChangeHandlers();
    // / for testing pusher connectivity
    window._pusher = this.pusher;
  }

  bindPusherStateChangeHandlers = () => {
    this.pusher.connection.bind('state_change', this.handlePusherStateChange);
  }

  unbindPusherStateChangeHandlers = () => {
    this.pusher.connection.unbind('state_change');
  }

  handlePusherStateChange = (states) => {
    // states = {previous: 'oldState', current: 'newState'}
    console.log('[State change] pusher state change:', states.previous, '->', states.current);
    if (states.current == 'connected') {  // pusher is connected
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    }
    else if (states.current == 'disconnected') {
      if (!this.reconnectTimer) {
        console.log('[State change] Pusher disconnected: retrying after 1 second...');
        this.reconnectTimer = setTimeout(this.reconnect, 1000);
      }
    }
  }

  reconnect = () => {
    console.log('Reconnecting Pusher...');
    clearTimeout(this.reconnectTimer);
    this.pusher.connection.connect();
    this.reconnectTimer = null;
  }

  checkPusherConnection = () => {
    console.log('[Periodical check] pusher state:', this.pusher.connection.state);
    if (this.pusher.connection.state !== 'connected') {
      if (!this.reconnectTimer) {
        console.log('[Periodical check] Pusher disconnected: retrying after 1 second...');
        this.reconnectTimer = setTimeout(this.reconnect, 1000);
      }
    }
    else {
      this.checkPusherConnectionCounter += 1;
      if (this.checkPusherConnectionCounter >= 18) {
        this.checkPusherConnectionCounter = 0;
        if (!this.reconnectTimer) {
          console.log('[Periodical check] reconnecting to prevent idle state');
          this.pusher.connection.disconnect();
        }
      }
    }
  }

  subscribeToGlobalChannel = () => {
    if (!this.globalChannel) {
      this.globalChannel = this.pusher.subscribe('global');
      this.globalChannel.bind('version_updated', this.handleUpdatedNoticeEvent);
      this.privateGlobalChannel = this.pusher.subscribe('private-global-channel'); // Used for direct client-client global messages
      this.privateGlobalChannel.bind('client-user_idle_status_change', this.handleIdleStatusChangeEvent);
    }
  }

  unsubscribeFromGlobalChannel = () => {
    if (this.globalChannel) {
      this.globalChannel.unbind('version_updated', this.handleUpdatedNoticeEvent);
      this.pusher.unsubscribe('global');
      this.privateGlobalChannel.unbind('client-user_idle_status_change', this.handleIdleStatusChangeEvent);
      this.pusher.unsubscribe('private-global-channel');
    }
  }

  subscribeToPusher = () => {
    if (!localStorage.getItem('mbubblz_user')) {
      return;
    }
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const userChannelName = 'private-user-' + user.id;
    this.userChannel = this.pusher.channels.channels[userChannelName];
    if (!this.userChannel) {
      this.userChannel = this.pusher.subscribe(userChannelName);
    }
  }

  unsubscribeFromPusher = () => {
    if (!localStorage.getItem('mbubblz_user')) {
      return;
    }
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const userChannelName = 'private-user-' + user.id;
    if (this.userChannel) {
      this.pusher.unsubscribe(userChannelName);
      this.userChannel = null;
    }
  }

  subscribeToPresenceChannel = () => {
    const pusher = this.pusher;
    this.presenceChannel = pusher.channels.channels['presence-online-users'];
    if (!this.presenceChannel) {
      this.presenceChannel = pusher.subscribe('presence-online-users');
    }
    this.presenceChannel.bind('pusher:subscription_succeeded', this.handlePresenceEvent);
    this.presenceChannel.bind('pusher:member_added', this.handlePresenceEvent);
    this.presenceChannel.bind('pusher:member_removed', this.handlePresenceEvent);
  }

  unsubscribeFromPresenceChannel = () => {
    if (this.presenceChannel) {
      this.presenceChannel.unbind('pusher:subscription_succeeded', this.handlePresenceEvent);
      this.presenceChannel.unbind('pusher:member_added', this.handlePresenceEvent);
      this.presenceChannel.unbind('pusher:member_removed', this.handlePresenceEvent);
      // pusher.unsubscribe('presence-online-users');
    }
  }

  handleIdleStatusChangeEvent = (data) => {
    const { userId, idle } = data;
    const onlineUsers = JSON.parse(this.state.onlineUsers);
    if (onlineUsers[userId]) {
      onlineUsers[userId].idle = idle;
      this.setState({
        onlineUsers: JSON.stringify(onlineUsers),
      });
      for (let i = 0; i < this.chatUpdateComponents.length; i++) {
        this.chatUpdateComponents[i].forceUpdate();
      }
    }
  }

  handlePresenceEvent = () => {
    const newOnlineUsers = {};
    const onlineUsers = JSON.parse(this.state.onlineUsers);
    for (const key in this.presenceChannel.members.members) {
      const member = this.presenceChannel.members.members[key];
      if (onlineUsers[key]) {
        member.idle = onlineUsers[key].idle;
      }
      else {
        member.idle = false;
      }
      newOnlineUsers[key] = member;
    }
    this.setChatState({
      onlineUsers: JSON.stringify(newOnlineUsers),
    });
    for (let i = 0; i < this.chatUpdateComponents.length; i++) {
      this.chatUpdateComponents[i].forceUpdate();
    }
  }

  handleUpdatedNoticeEvent = () => {
    this.setState({
      showUpdateNotice: true,
    });
  }

  getChatState = () => {
    const { unreadMessageCount, chatboxOpenStatuses, __need_for_updating, onlineUsers } = this.state;
    return { unreadMessageCount, chatboxOpenStatuses, __need_for_updating, onlineUsers };
  }

  setChatState = (values) => {
    this.setState(values);
    for (let i = 0; i < this.chatUpdateComponents.length; i++) {
      this.chatUpdateComponents[i].forceUpdate();
    }
  }

  addChatUpdateComponent = (component) => {
    this.chatUpdateComponents.push(component);
  }

  removeChatUpdateComponent = (component) => {
    for (let i = 0; i < this.chatUpdateComponents.length; i++) {
      if (this.chatUpdateComponents[i] === component) {
        this.chatUpdateComponents.splice(i, 1);
        break;
      }
    }
  }

  onResetUnreadMsgCount = (friendId) => {
    const { unreadMessageCount } = this.state;
    unreadMessageCount[friendId] = 0;
    this.setChatState({
      unreadMessageCount: unreadMessageCount,
      __need_for_updating: Math.random() * 10000,
    });
  }

  onIncUnreadMsgCount = (friendId, minimized) => {
    const { unreadMessageCount, chatboxOpenStatuses, openMessageFriendId } = this.state;
    const msg = unreadMessageCount[friendId] ? unreadMessageCount[friendId] : 0;
    unreadMessageCount[friendId] = (chatboxOpenStatuses[friendId] || openMessageFriendId === friendId)
      && !minimized ?
        0
      :
        msg + 1;
    this.setChatState({
      unreadMessageCount: unreadMessageCount,
      __need_for_updating: Math.random() * 10000,
    });
  }

  setUnreadInitial = (count, friendId) => {
    const { unreadMessageCount } = this.state;
    unreadMessageCount[friendId] = count + 1;
    this.setChatState({
      unreadMessageCount: unreadMessageCount,
      __need_for_updating: Math.random() * 10000,
    });
  }

  chatBoxState = (id, opened) => {
    const { chatboxOpenStatuses } = this.state;
    chatboxOpenStatuses[id] = opened;
    return chatboxOpenStatuses;
  }

  onCloseChatbox = (friendId) => {
    this.setChatState({
      chatboxOpenStatuses: this.chatBoxState(friendId, false),
      __need_for_updating: Math.random() * 10000,
    });
  }

  onOpenChatbox = (friendId) => {
    const { unreadMessageCount, chatboxMinimizeStatuses } = this.state;
    unreadMessageCount[friendId] = 0;
    chatboxMinimizeStatuses[friendId] = false;

    this.setChatState({
      unreadMessageCount: unreadMessageCount,
      chatboxMinimizeStatuses: chatboxMinimizeStatuses,
      chatboxOpenStatuses: this.chatBoxState(friendId, true),
      __need_for_updating: Math.random() * 10000,
    });
  }

  onToggleMinimize = (id, channelName) => {
    const { chatboxMinimizeStatuses } = this.state;
    chatboxMinimizeStatuses[id] = !chatboxMinimizeStatuses[id];
    this.setState({
      chatboxMinimizeStatuses: chatboxMinimizeStatuses,
    });
    if (!chatboxMinimizeStatuses[id]) {
      this.onResetUnreadMsgCount(id);
      setTimeout(() => {
        this.props.clearUnreadCount({ variables: { channelName: channelName } });
      }, 1000);
    }
  }

  onOpenMessage = (friendId) => {
    // intentionally using setState instead of setChatState here,
    // because other chat components don't need to be updated
    setTimeout(() => {
      this.setState({
        openMessageFriendId: friendId,
      });
    }, 500);
  }

  onCloseMessage = () => {
    // intentionally using setState instead of setChatState here,
    // because other chat components don't need to be updated
    this.setState({
      openMessageFriendId: 0,
    });
  }

  openFeedbackDialog = () => {
    this.setState({
      openFeedbackDialog: true,
    });
  }

  closeFeedbackDialog = () => {
    this.setState({
      openFeedbackDialog: false,
    });
  }

  handleRefreshWindow = () => {
    this.setState({
      showUpdateNotice: false,
    });
    window.location.reload();
  }

  unsubscribeAllChannels = () => {
    // this.unsubscribeFromPusher();
    // this.unsubscribeFromPresenceChannel();
    const pusher = this.pusher;
    if (pusher && pusher.channels.channels) {
      for (const channel in pusher.channels.channels) {
        pusher.unsubscribe(channel);
      }
    }
  }

  handleSignout = () => {
    this.props.client.resetStore();
  }

  handleBeforeUnload = (e) => {
    const now = Math.floor(Date.now() / 1000);
    if (now > this.loggedInMoment) {
      e.cancelBubble = false;
      e.preventDefault();
      e.stopPropagation();

      this.props.reportOnlineTime({ variables: { session_time: now - this.loggedInMoment } });

      setTimeout(() => {
        window.removeEventListener('beforeunload', this.handleBeforeUnload, false);
        window.dispatchEvent(new Event('beforeunload'));
      }, 100);
    }
  }

  bindUnloadHandler = () => {
    window.addEventListener('beforeunload', this.handleBeforeUnload, false);
  }

  changeSearchKeyword = (value) => {
    this.setState({
      searchKeyword: value,
      __need_for_updating: Math.random() * 10000,
    });
  }

  currentTime() {
    return Math.floor(Date.now() / 1000);
  }

  handleIdle = () => {
    this.idleStartTime = this.currentTime();
  }

  handleActive = () => {
    if (this.idleStartTime > 0) {
      this.loggedInMoment += (this.currentTime - this.idleStartTime);
    }
  }

  componentWillMount() {
    this.subscribeToGlobalChannel();
    this.subscribeToPusher();
    this.subscribeToPresenceChannel();
    this.bindUnloadHandler();
  }

  componentDidMount() {
    this.loggedInMoment = this.currentTime();
  }

  componentWillUnmount() {
    // / this.unbindPusherStateChangeHandlers();
    // this.unsubscribeFromGlobalChannel();
    // this.unsubscribeFromPresenceChannel();
    // this.unsubscribeFromPusher();
    this.unsubscribeAllChannels();
    // window.removeEventListener('beforeunload', this.handleUnload);
  }

  /*componentWillReceiveProps(nextProps) {
    const { currentUser } = nextProps.data;
    const unreadMessageCount = {};
    if (currentUser && currentUser.friends.edges) {
      currentUser.friends.edges.map(friend => {
        unreadMessageCount[friend.node.id] = friend.node.wheel_chat_missed_messages_count;
      });
    }
    this.setState({
      unreadMessageCount
    });
  }*/

  render() {
    if (!this.props.data.loading) {
      if (!this.props.data.currentUser || this.props.data.errors) {
        setTimeout(() => {
          this.props.router.push('/signin');
        }, 50);
        setTimeout(()=> {
          localStorage.setItem('mbubblz_client_id', '');
          localStorage.setItem('mbubblz_token', '');
          localStorage.setItem('mbubblz_user', '');
          localStorage.setItem('mbubblz_username', '');
        }, 1000);
        return;
      }
    }

    const { children } = this.props;
    const {
      unreadMessageCount, chatboxOpenStatuses, chatboxMinimizeStatuses, __need_for_updating, onlineUsers,
      showUpdateNotice,
    } = this.state;
    const title = 'My Bubblz (beta)';

    let unreadMsgs = 0;
    for (const k in unreadMessageCount) {
      unreadMsgs = unreadMsgs + unreadMessageCount[k];
    }

    const feedbackButtonContainerStyle = {
      position: 'fixed',
      left: 8,
      bottom: 0,
      zIndex: 900,
    };

    const childrenWithProps = React.Children.map(children,
     (child) => React.cloneElement(child, {
       changeSearchKeyword: this.changeSearchKeyword,
       unreadMessageCount: unreadMessageCount,
       __need_for_updating: __need_for_updating,
     })
    );

    return (
      <div id='mybubblz-root-app' className='app-container'>
        <Helmet
          title={unreadMsgs > 0 ? `(${unreadMsgs}) ${title}` : title} />
        <CallConnectionManager
          ref='callConnectionManager'
          onlineUsers={onlineUsers}
          registerCallFunctions={this.registerCallFunctions} />
        <IdleStatusChecker onIdle={this.handleIdle} onActive={this.handleActive} />
        <HeaderSigned
          unreadMessageCount={unreadMessageCount}
          __need_for_updating={__need_for_updating}
          onSignout={this.handleSignout}
          searchKeyword={this.state.searchKeyword}
          changeSearchKeyword={this.changeSearchKeyword}
          hideSearch={this.props.location.pathname.indexOf('help') > -1}
        />
        <Notifications />
        <Snackbar
          open={showUpdateNotice}
          message='MyBubblz has been updated to a new version.'
          action='Refresh'
          onActionTouchTap={this.handleRefreshWindow}
          onRequestClose={e => e} />
        {childrenWithProps}
        { (this.props.location.pathname === '/messages'
          || this.props.location.pathname.indexOf('gallery') > -1
          || this.props.location.pathname.indexOf('chat') > -1)
          && $(window).width() < 480
          || this.props.location.pathname.indexOf('help') > -1
          ?
          ''
          :
          <ChatBar
            onlineUsers={onlineUsers}
            onResetUnreadMsgCount={this.onResetUnreadMsgCount}
            onIncUnreadMsgCount={this.onIncUnreadMsgCount}
            setUnreadInitial={this.setUnreadInitial}
            unreadMessageCount={unreadMessageCount}
            chatboxOpenStatuses={chatboxOpenStatuses}
            chatboxMinimizeStatuses={chatboxMinimizeStatuses}
            onCloseChatbox={this.onCloseChatbox}
            onOpenChatbox={this.onOpenChatbox}
            onToggleMinimize={this.onToggleMinimize}
            changeSearchKeyword={this.changeSearchKeyword}
            __need_for_updating={__need_for_updating} />
        }
        { (this.props.location.pathname === '/messages'
          || this.props.location.pathname.indexOf('chat') > -1)
          && $(window).width() < 480 ?
          null
          :
          <div style={feedbackButtonContainerStyle}>
            <FlatButton
              backgroundColor='#f1f1f1'
              hoverColor='#eeeeee'
              label='Send feedback'
              labelStyle={{ color: '#333', textTransform: 'none' }}
              style={{ padding: '0px 4px', color: '#333' }}
              onClick={this.openFeedbackDialog}
            />
          </div>
        }
        <Dialog
          modal={false}
          open={this.state.openFeedbackDialog}
          onRequestClose={this.closeFeedbackDialog}
          autoDetectWindowHeight
          autoScrollBodyContent
          repositionOnUpdate={false}
          style={{ paddingTop: 30 }}
        >
          <FeedbackForm onSubmit={this.closeFeedbackDialog} />
        </Dialog>
      </div>
    );
  }
}

export default withApollo(hoc(InnerPageLayout));
