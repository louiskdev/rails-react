/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Link } from 'react-router';
import FlatButton from 'material-ui/FlatButton';
import { List } from 'material-ui/List';
import ChatIcon from 'material-ui/svg-icons/communication/chat';
import IconSocialNotificationsActive from 'material-ui/svg-icons/social/notifications-active';
import IconSocialPeople from 'material-ui/svg-icons/social/people';

import MessagesUserListItem from '../MessagesUserListItem';
import MessagesContent from '../MessagesContent';
import hoc from './hoc';

class Messages extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
    chatFunctions: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      openChatFriendId: 0,
      messagesContainerHeight: 500,
      friends: [],
    };
    this.pusherChannelOpened = false;
  }

  listenPusher = () => {
    if (this.pusherChannelOpened) {
      return;
    }
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    this.pusherChannelOpened = true;
    const channel = this.context.userChannel;
    channel.bind('important', this.refresh);
    channel.bind('avatar_changed', this.handleAvatarChanged);
    channel.bind('friend_avatar_changed', this.handleFriendAvatarChanged);
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
  }

  refresh = (data) => {
    if (data.message === 'need_to_reload_notifications') {
      this.props.data.refetch();
    }
  }

  handleAvatarChanged = (data) => {
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const newObj = {};
    newObj[`user_avatar_${user.username}`] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  handleFriendAvatarChanged = (data) => {
    const newObj = {};
    newObj['user_avatar_' + data.user_data.username] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  onSelectFriend = (friendId, channelName) => {
    this.props.clearUnreadCount({ variables: { channelName: channelName } });
    if (this.props.onOpenMessage) {
      this.props.onOpenMessage(friendId);
    }
    this.context.chatFunctions.onOpenMessage(friendId);
    this.setState({
      openChatFriendId: friendId,
    });
  }

  onCloseMessage = () => {
    if (this.props.onCloseMessage) {
      this.props.onCloseMessage(friendId);
    }
    this.context.chatFunctions.onCloseMessage();
    this.setState({
      openChatFriendId: 0,
    });
  }

  onWindowResize = () => {
    const msgbox = ReactDOM.findDOMNode(this);
    if (msgbox) {
      const msgboxSize = msgbox.getBoundingClientRect();
      const msgHeight = $(window).width() > 480 ? window.innerHeight - 98 : window.innerHeight - 138;
      this.setState({
        messagesContainerHeight: msgHeight,
      });
    }
  }

  onMessageSent = (channelName) => {
    const currentUser = this.props.data.currentUser;
    if (currentUser) {
      const friendsInit = this.getFriends();
      const friends = JSON.parse(JSON.stringify(friendsInit));

      for (let i = 0; i < friends.length; i++) {
        const friend = friends[i];
        const friendChannelName =
          parseInt(currentUser.id) <= parseInt(friend.node.id) ?
          `${currentUser.id}_${friend.node.id}` :
          `${friend.node.id}_${currentUser.id}`;
        if (friendChannelName == channelName) {
          friends.splice(i, 1);
          friends.splice(0, 0, friend);
          this.setState({
            friends,
          });
          break;
        }
      }
    }
  }

  getFriends = () => {
    const currentUser = this.props.data.currentUser;
    return this.state.friends.length > 0 ? this.state.friends : (currentUser ? currentUser.friends.edges : []);
  }

  componentDidUpdate() {
    this.listenPusher();
  }

  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize);
    this.context.chatFunctions.addChatUpdateComponent(this);
    setTimeout(() => {
      this.onWindowResize();
    }, 10);
  }

  componentWillUnmount() {
    this.unlistenPusher();
    window.removeEventListener('resize', this.onWindowResize);
    this.context.chatFunctions.removeChatUpdateComponent(this);
    this.setState({
      openChatFriendId: 0,
    });
  }

  componentWillReceiveProps(nextProps) {
    this.onWindowResize();
  }

  backToConversations = () => {
    this.setState({
      openChatFriendId: 0,
    });
  }

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

    if (!this.props.data.currentUser) {
      return (
        <div>Messages loading ...</div>
      );
    }
    else {
      const topBtnStyle = {
        borderRadius: 0,
        padding: '12px 24px',
        margin: 0,
        color: '#fff',
        fontSize: 12,
        height: 'auto',
        minWidth: 90,
        border: '3px solid rgb(115, 211, 228)',
        textTransform: 'uppercase',
      };
      const topBtnBgColor = '#73d3e4';
      const topBtnBorder = '3px solid #40a5b7';
      const topBtnBgColorInactive = 'rgb(115, 211, 228)';
      const topBtnColorInactive = 'rgba(255, 255, 255, 0.65)';
      const currentUser = this.props.data.currentUser;
      const friends = this.getFriends();
      const userId = currentUser.id;
      const username = currentUser.username;
      const { unreadMessageCount } = this.props;
      const { messagesContainerHeight } = this.state;
      const userAvatar = this.state[`user_avatar_${username}`] ? this.state[`user_avatar_${username}`] : currentUser.avatar_url;
      {/* <div className='myb-messages-box' style={{ height: messagesContainerHeight }} ref='messagesBox'>*/}
      return (
        <div className='myb-messages-box' ref='messagesBox'>
          <div className='topbar'>
            <FlatButton
              className={this.state.openChatFriendId > 0 ? 'myb-small-button selected' : 'myb-small-button'}
              backgroundColor={topBtnBgColor}
              hoverColor={topBtnBgColor}
              style={{ ...topBtnStyle, border: 'none', borderBottom: topBtnBorder }}
              onClick={this.backToConversations}
            >
              {this.state.openChatFriendId > 0 && $(window).width() < 768 ? 'Back' : 'Chat'}
            </FlatButton>
            <Link to='/notifications'>
              <FlatButton
                className='myb-small-button'
                backgroundColor={topBtnBgColorInactive}
                hoverColor={topBtnBgColorInactive}
                style={{ ...topBtnStyle, color: topBtnColorInactive, padding: $(window).width() < 768 ? '5px 24px' : '12px 24px' }}
              >
                { $(window).width() < 768 ? <IconSocialNotificationsActive color='#fff' style={{ verticalAlign: '-30%', width: 20 }}/> : 'Notifications' }
              </FlatButton>
            </Link>
            <Link to='/friendnotifications'>
              <FlatButton
                className='myb-small-button'
                backgroundColor={topBtnBgColorInactive}
                hoverColor={topBtnBgColorInactive}
                style={{ ...topBtnStyle, color: topBtnColorInactive, padding: $(window).width() < 768 ? '5px 24px' : '12px 24px' }}
              >
                { $(window).width() < 768 ? <IconSocialPeople color='#fff' style={{ verticalAlign: '-30%', width: 20 }}/> : 'Friend Notifications'}
              </FlatButton>
            </Link>
          </div>
          <div className='content'>
            <div className={this.state.openChatFriendId > 0 ? 'users selected' : 'users'}>
              <List className='chat-users' style={{ padding: 0, height: messagesContainerHeight }}>
                {friends.map((friend, index) => {
                  const friendId = parseInt(friend.node.id, 10);
                  const channelName = parseInt(userId, 10) < friendId ? `${userId}_${friendId}` : `${friendId}_${userId}`;
                  const friendAvatar = this.state[`user_avatar_${friend.node.username}`] ? this.state[`user_avatar_${friend.node.username}`] : friend.node.avatar_url;
                  return (
                    <MessagesUserListItem
                      key={channelName}
                      friend={friend.node}
                      friendAvatar={friendAvatar}
                      channelName={channelName}
                      open={friendId === this.state.openChatFriendId}
                      unreadMessageCount={typeof unreadMessageCount[friendId] === 'undefined' ? friend.node.wheel_chat_missed_messages_count : unreadMessageCount[friendId]}
                      onClick={this.onSelectFriend.bind(this, friendId, channelName)}
                      lastMessage={friend.node.wheel_chat_last_message}
                    />
                  );
                })}
              </List>
            </div>
            <div className={this.state.openChatFriendId > 0 ? 'dialog selected' : 'dialog'}>
              {this.props.openMessageFriendId === 0 ?
                <div className='select-dialog' style={{ padding: 0, height: messagesContainerHeight }}>
                  <div>
                    <ChatIcon style={{ width: 64, height: 64 }} color='#e4e4e4'/>
                    <div>Please select a dialog</div>
                  </div>
                </div>
                :
                friends.map((friend, index) => {
                  /* if (!friend.node.wheel_chat_last_message) {
                    return undefined;
                  }*/
                  const friendId = parseInt(friend.node.id, 10);
                  if (friendId !== this.props.openMessageFriendId) {
                    return undefined;
                  }
                  const channelName = parseInt(userId) < parseInt(friendId) ? `${userId}_${friendId}` : `${friendId}_${userId}`;
                  const friendAvatar = this.state[`user_avatar_${friend.node.username}`] ? this.state[`user_avatar_${friend.node.username}`] : friend.node.avatar_url;
                  return (
                    <MessagesContent
                      key={channelName}
                      open={friendId === this.props.openMessageFriendId}
                      channelName={channelName}
                      friendAvatar={friendAvatar}
                      userAvatar={userAvatar}
                      friend={friend.node}
                      onMessageSent={this.onMessageSent}
                      openMessageFriendId={this.props.openMessageFriendId}
                      onCloseMessage={this.onCloseMessage}
                      contentHeight={messagesContainerHeight}
                    />
                  );
                })
              }
            </div>
          </div>
        </div>
      );
    }
  }

}

export default hoc(Messages);
