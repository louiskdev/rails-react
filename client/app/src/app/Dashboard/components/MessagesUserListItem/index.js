/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import moment from 'moment';
import IconCamera from 'material-ui/svg-icons/image/photo-camera';
import IconVideo from 'material-ui/svg-icons/av/videocam';
import { ListItem } from 'material-ui/List';
import { emojify } from 'react-emojione2';

class MessagesUserListItem extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    chatFunctions: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      lastMsg: this.props.lastMessage ? this.props.lastMessage : false,
      timeAgo: null,
    };
    this.timeAgoInterval = null;
  }

  subscribeToPusherChannel = () => {
    const pusher = this.context.pusher;
    const { channelName } = this.props;
    let channel = pusher.channels.channels[`private-messages_${channelName}`];
    if (!channel) {
      channel = pusher.subscribe(`private-messages_${channelName}`);
    }
    channel.bind('new_1v1_message', this.onNew1v1Message);
  }

  unsubscribeFromPusherChannel = () => {
    const { channelName } = this.props;
    const pusher = this.context.pusher;
    const channel = pusher.channels.channels[`private-messages_${channelName}`];
    if (channel) {
      channel.unbind('new_1v1_message', this.onNew1v1Message);
      // pusher.unsubscribe('private-messages_' + channelName);
    }
  }

  onNew1v1Message = (data) => {
    const msg = {
      text: data.message.text,
      created_at: data.message.created_at,
      author: {
        avatar_url: data.message.author.thumb_avatar_url,
        username: data.message.author.username,
      },
      medium: {
        id: data.message.media.id,
        type: data.message.media.type,
        thumb_url: data.message.media.thumb_url,
        picture_url: data.message.media.picture_url,
        video_links: data.message.media.video_links,
      },
      link_preview: data.message.link_preview,
    };
    this.setState({
      lastMsg: msg,
    });
  }

  componentWillMount() {
    this.subscribeToPusherChannel();
    this.setTime(this.state.lastMsg);
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
    clearInterval(this.timeAgoInterval);
  }

  componentDidMount() {
    this.timeAgoInterval = setInterval(() => {
      this.setTime(this.state.lastMsg);
    }, 10000);
  }

  setTime = (chat) => {
    if (chat.created_at) {
      const dateString = moment.utc(chat.created_at.replace(' UTC', '')).toDate();
      const timeAgo = moment().diff(dateString, 'days') < 1 ?
        moment(dateString).fromNow().replace('a few seconds ago', 'just now').replace('a day ago', 'yesterday')
        :
        moment(dateString).format('MMM Do, YYYY - hh:mm a');
      this.setState({ timeAgo });
    }
  }

  render() {
    const { friend, open, unreadMessageCount, onClick } = this.props;
    const messageTextStyle = {
      height: 'auto',
      margin: 0,
      lineHeight: 1.45,
      minHeight: 18,
      whiteSpace: 'normal',
      fontSize: '12px',
    };
    const emojiOptions = {
      convertShortnames: true,
      convertUnicode: true,
      convertAscii: true,
      styles: {
        backgroundImage: 'url(/assets/emojione.sprites.png)',
        width: '64px',
        height: '64px',
        margin: '4px',
      },
    };
    const { lastMessage, friendAvatar } = this.props;
    let lastMsgObj = lastMessage;
    if (this.state.lastMsg) {
      lastMsgObj = this.state.lastMsg;
    }

    let truncatedString = lastMsgObj ? lastMsgObj.text : '';
    if (truncatedString) {
      if (truncatedString.length > 28) {
        truncatedString = `${truncatedString.substring(0, 28)}...`;
      }
    }
    let lastMsg = lastMsgObj && truncatedString ?
      emojify(
        truncatedString
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>'),
        emojiOptions
      )
      :
      'No messages yet';
    const lastMsgIcon = {
      verticalAlign: '-30%',
      width: 18,
      height: 18,
      marginRight: 4,
    };
    if (lastMsg === 'No messages yet' && lastMsgObj) {
      if (lastMsgObj.medium) {
        if (lastMsgObj.medium.type === 'picture') {
          lastMsg = <span><IconCamera color='#979797' style={lastMsgIcon}/>Image</span>;
        }
        else if (lastMsgObj.medium.type === 'video') {
          lastMsg = <span><IconVideo color='#979797' style={lastMsgIcon}/>Video</span>;
        }
        else if (lastMsgObj.link_preview.url) {
          lastMsg = lastMsgObj.link_preview.url;
        }
      }
    }

    const lastMsgUser = lastMsgObj ?
      (lastMsgObj.author.username === friend.username ? '' : 'You')
      :
      '';
    const _onlineUsers = this.context.chatFunctions.getChatState().onlineUsers;
    const onlineUsers = _onlineUsers ? JSON.parse(_onlineUsers) : {};
    return (
      <ListItem
        className={open ? 'chat-user active' : 'chat-user'}
        leftAvatar={
          <span style={{ top: 20 }}>
            <img className='chat-user-avatar' src={friendAvatar} role='presentation' />
            {
              onlineUsers[parseInt(friend.id)] ?
              <span className={'online-status' + (onlineUsers[parseInt(friend.id)].idle ? ' idle' : '')} />
              :
              <span className='online-status offline' />
            }
          </span>
        }
        primaryText={
          <div>
            <span style={{ textTransform: 'capitalize', fontSize: '0.9em' }}>{friend.username}</span>
            <div className='chat-date'>{this.state.timeAgo}</div>
          </div>
        }
        secondaryText={
          <div style={messageTextStyle}>
            {
              open ?
                <span className='online' />
              :
              (
                lastMsgObj && unreadMessageCount ?
                  <div className='chat-count'>{unreadMessageCount}</div>
                :
                ''
              )
            }
            <span className='you'>{lastMsgUser ? `${lastMsgUser}:` : ''}</span> {lastMsg}
          </div>
        }
        style={{ fontSize: 14 }}
        onClick={onClick}
      />
    );
  }
}

MessagesUserListItem.propTypes = {
  channelName: React.PropTypes.string,
  lastMessage: React.PropTypes.object,
  friendAvatar: React.PropTypes.string,
  friend: React.PropTypes.object,
  open: React.PropTypes.bool,
  unreadMessageCount: React.PropTypes.number,
  onClick: React.PropTypes.func,

};

export default MessagesUserListItem;
