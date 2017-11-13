/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import IconNavigationClose from 'material-ui/svg-icons/navigation/close';
import IconAVVideocam from 'material-ui/svg-icons/av/videocam';
import IconCommunicationPhone from 'material-ui/svg-icons/communication/phone';

import InputField from '@common/InputField';
import ChatBoxItem from '@common/ChatBoxItem';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

class ChatBox extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    callFunctions: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.shouldScrollToBottom = false;

    this.state = {
      history: [],
      videoIsOpen: false,
      openedVideoMsgIndex: -1,
      typingUsername: '',
      activeTyping: false,
      lostFocus: false,
      infiniteLoading: false,
      allLoaded: false,
      mounted: false,
    };
  }

  cloneAndReverse = (srcArray) => {
    const newArray = [];
    for (let i = 0; i < srcArray.length; i++) {
      newArray.push(srcArray[i]);
    }
    return newArray.reverse();
  }

  getHistory = () => {
    const historyState = this.state.history;
    const historyProps = !this.props.data.loading && this.props.data.wheelchat ?
      this.cloneAndReverse(this.props.data.wheelchat.history.edges)
      :
      [];
    return historyState.length > historyProps.length ? historyState : historyProps;
  }

  subscribeToPusherChannel = () => {
    const pusher = this.context.pusher;
    const { channelName } = this.props;

    let channel = pusher.channels.channels['private-messages_' + channelName];
    if (!channel) {
      channel = pusher.subscribe('private-messages_' + channelName);
    }
    channel.bind('new_1v1_message', this.onNew1v1Message);
    channel.bind('client-typing_status', this.onClientTypingStatus);
  }

  unsubscribeFromPusherChannel = () => {
    const { channelName } = this.props;
    const pusher = this.context.pusher;
    const channel = pusher.channels.channels['private-messages_' + channelName];
    if (channel) {
      channel.unbind('new_1v1_message', this.onNew1v1Message);
      channel.unbind('client-typing_status', this.onClientTypingStatus);
      // pusher.unsubscribe('private-messages_' + channelName);
    }
  }

  onNew1v1Message = (data) => {
    const historyState = this.getHistory();
    const historyStateIds = historyState.map((item) => {
      return parseInt(item.node.id);
    });
    if (!historyStateIds.includes(data.message.id)) {
      this.addNewMessageToChat(data.message);
    }
  }

  onClientTypingStatus = (data) => {
    if (data.typing && this.state.mounted) {
      if ((data.fromUsername === this.props.friend.username) && (this.props.channelName === data.channelName)) {
        this.setState({
          typingUsername: data.fromUsername,
          activeTyping: true,
        });
        setTimeout(() => {
          this.setState({ activeTyping: '' });
        }, 3000);
      }
    }
    else {
      this.setState({
        typingUsername: '',
      });
    }
  }

  addNewMessageToChat = (data) => {
    const historyState = this.getHistory();
    const medium = data.media || data.medium;
    historyState.push({
      node: {
        __typename: 'WheelChatMessage',
        id: data.id,
        text: data.text,
        created_at: data.created_at,
        author: {
          __typename: 'User',
          avatar_url: data.author.thumb_avatar_url || data.author.avatar_url,
          username: data.author.username,
        },
        medium: medium ? {
          id: medium.id,
          type: medium.type,
          thumb_url: medium.thumb_url,
          picture_url: medium.picture_url,
          video_links: medium.video_links,
          recoding_job_id: medium.recoding_job_key || medium.recoding_job_id,
        } : null,
        link_preview: data.link_preview,
      },
    });
    this.shouldScrollToBottom = true;
    this.setState({
      history: historyState,
    });
    const { friend } = this.props;
    this.props.onMessageReceived(data.author.username, parseInt(friend.id, 10), this.state.lostFocus);
  }

  onSendMessage = (vars) => {
    if (this.props.onMessageSent) {
      this.props.onMessageSent(this.props.friend.id);
    }
    const { channelName } = this.props;
    vars.channel_name = channelName;
    this.props.sendMessage({ variables: vars })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {
        this.addNewMessageToChat(data.createWheelChatMessage.message);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  scrollTo = (element, to, duration) => {
    // if (duration <= 0) return;
    // var difference = to - element.scrollTop;
    // var perTick = difference / duration * 10;

    // setTimeout(() => {
    //   element.scrollTop = element.scrollTop + perTick;
    //   if (element.scrollTop >= to - 5) return;
    //   this.scrollTo(element, to, duration - 10);
    // }, 10);
    element.scrollTop = to;
  }

  handleFocusEvent = (e) => {
    // const container = $('#myb-chatbar-box-' + self.props.friend.username);
    const container = $(ReactDOM.findDOMNode(this.refs.chatbox));
    const self = this;

    if (!container.is(e.target) // if the target of the click isn't the container...
        && container.has(e.target).length === 0) // ... nor a descendant of the container
    {
      if (!self.state.lostFocus && self.props.open) {
        self.setState({
          lostFocus: true,
        });
      }
    }
    else {
      self.setState({
        lostFocus: false,
      });
      setTimeout(() => {
        container.find('.new-message-input').focus();
      }, 100);
    }
  }

  componentWillMount() {
    this.shouldScrollToBottom = true;
    this.subscribeToPusherChannel();
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
    document.removeEventListener('mouseup', this.handleFocusEvent);
    this.setState({
      mounted: false,
    });
  }

  componentDidUpdate() {
    if (this.props.open && this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      if (this.refs.chatsContainer) {

        setTimeout(() => {
          const chatsContainer = this.refs.chatsContainer;
          if (chatsContainer) {
            this.scrollTo(chatsContainer, chatsContainer.scrollHeight, 150);
          }
        }, 200);
      }
    }
  }

  componentDidMount() {
    const chatbox = this.refs.chatbox;
    if (chatbox) {
      chatbox.addEventListener('scroll', (event) => {
        event.stopPropagation();
      });
    }
    document.getElementById('my_movie');
    document.addEventListener('mouseup', this.handleFocusEvent);
    this.setState({
      mounted: true,
    });
  }

  componentWillReceiveProps(nextProps) {
    const el = ReactDOM.findDOMNode(this);
    if (el && !this.state.lostFocus) {
      setTimeout(() => {
        $(el).find('.new-message-input').focus();
      }, 100);
    }
  }

  handleScroll = () => {
    const chatsContainer = this.refs.chatsContainer;
    const { infiniteLoading, allLoaded } = this.state;
    if (chatsContainer) {
      const load = chatsContainer.scrollTop < chatsContainer.scrollHeight * 0.08;
      if (load && !infiniteLoading && !allLoaded) {
        this.handleInfiniteLoad();
      }
    }
  }

  handleInfiniteLoad = () => {
    const historyState = this.getHistory();
    if (!historyState.length) {
      return;
    }
    if (this.state.infiniteLoading) {
      return;
    }
    // save scrollTop and scrollHeight before infinite load
    const scrollTopBeforeLoad = this.refs.chatsContainer.scrollTop;
    const scrollHeightBeforeLoad = this.refs.chatsContainer.scrollHeight;
    // start infinite loading
    this.setState({
      infiniteLoading: true,
    });
    this.props.client.query({
      query: gql`
        query getWheelchat($channelName: String!, $lastCursor: String!) {
          wheelchat(channel_name: $channelName) {
            history(first: 30, after: $lastCursor, order_by: "date", reverse_order: true) {
              edges {
                cursor
                node {
                  text
                  created_at
                  video_url
                  author {
                    id
                    username
                    avatar_url(version: "micro")
                  }
                  medium {
                    id
                    thumb_url
                    picture_url
                    video_links
                    recoding_job_id
                  }
                  link_preview {
                    description
                    id
                    picture_url
                    title
                    url
                  }
                }
              }
            }
          }
        }
      `,
      forceFetch: true,
      variables: {
        lastCursor: historyState[0].cursor,
        channelName: this.props.data.wheelchat.channel_name,
      },
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
        this.setState({
          infiniteLoading: false,
        });
      }
      else {

        // Update history data
        if (data.wheelchat && data.wheelchat.history.edges.length > 0) {
          let newHistory = [];
          newHistory = this.cloneAndReverse(data.wheelchat.history.edges);
          historyState.forEach((history) => {
            newHistory.push(history);
          });

          this.setState({
            infiniteLoading: false,
            history: newHistory,
            __r: Math.random() * 100000,  // same effect as forceUpdate()
          });

          // Give React some time to update DOM, and then try to keep user's view at the same location
          setTimeout(() => {
            const chatsContainer = this.refs.chatsContainer;
            if (chatsContainer) {
              this.refs.chatsContainer.scrollTop = scrollTopBeforeLoad + chatsContainer.scrollHeight - scrollHeightBeforeLoad;
            }
          }, 0);
        }
        else {
          this.setState({
            infiniteLoading: false,
            allLoaded: true,
          });
        }
      }

    }).catch((error) => {

      notify.show(error.message, 'error', 2000);

      this.setState({
        infiniteLoading: false,
      });

    });
  }

  handleAudioCall = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { callFunctions } = this.context;
    const { friend } = this.props;
    callFunctions.startDirectCall(friend.id, friend.username, friend.avatar_url);
  }

  handleVideoCall = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const { callFunctions } = this.context;
    const { friend } = this.props;
    callFunctions.startDirectVideoCall(friend.id, friend.username, friend.avatar_url);
  }

  render() {
    if (this.props.data.loading) {
      return (
        <div />
      );
    }
    else {
      const { open, friend, minimized, onClose, friendAvatar } = this.props;
      const username = friend.username;
      const fromUsername = JSON.parse(localStorage.getItem('mbubblz_user')).username;
      const audioIconStyle = {
        width: 22,
        height: 22,
        verticalAlign: '-30%',
        marginLeft: 5,
      };
      const callIconStyle = {
        width: 16,
        height: 16,
        verticalAlign: '-15%',
        marginLeft: 5,
      };
      const closeIconStyle = {
        width: 20,
        height: 20,
        verticalAlign: '-25%',
        float: 'right',
      };
      const history = this.getHistory();
      const lostFocus = this.state.lostFocus;

      const onlineStatus = this.props.onlineUsers[parseInt(friend.id)] ?
        <span className={'online-status' + (this.props.onlineUsers[parseInt(friend.id)].idle ? ' idle' : '')} />
        :
        <span className='online-status offline' />

      return (
        <div id={'myb-chatbar-box-' + username} className={'myb-chatbar-chatbox myb-chatbar-box' + (open ? ' open' : '') + (minimized ? ' minimized' : '') + (lostFocus ? ' lostFocus' : '')} ref='chatbox'>
          <div className={ minimized && this.props.unreadMsgCount > 0 ? (lostFocus ? 'user-titlebar blink-grey' : 'user-titlebar blink') : 'user-titlebar'} onClick={this.props.onToggleMinimize}>
            <Link className="username" to={`/u/${username}`} style={{ color: '#ffffff' }}>
              {username} {onlineStatus}
            </Link>
            <a href='javascript:;' onClick={this.handleVideoCall}>
              <IconAVVideocam color='#ffffff' style={audioIconStyle} />
            </a>
            <a href='javascript:;' onClick={this.handleAudioCall}>
              <IconCommunicationPhone color='#ffffff' style={callIconStyle} />
            </a>
            <a href='javascript:void(0)' onClick={onClose}>
              <IconNavigationClose color='#ffffff' style={closeIconStyle} />
            </a>
            <div className={this.props.playSound && lostFocus ? 'soundbar active' : 'soundbar'}>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className='chat-contents' ref='chatsContainer' onScroll={this.handleScroll}>
            <div className='chat-contents-wrapper' ref='chatsWrapper'>
              {this.state.infiniteLoading ? <div className='loadingState'>Loading...</div> : null}
              {history.map((chat, index) => {
                return (
                  <ChatBoxItem
                    type='privchat'
                    key={index}
                    username={username}
                    friendAvatar={friendAvatar}
                    chat={chat.node} />
                );
              })}
              {username === this.state.typingUsername ?
                (
                  this.state.activeTyping ?
                  <div className='chat-message-one typing-status'>
                    <div className='spinner'>
                      <div className='bounce1' />
                      <div className='bounce2' />
                      <div className='bounce3' />
                    </div>
                  </div>
                  :
                  <div className='typing-status inactive'>
                    <div className='spinner'>
                      <div className='bounce1' />
                      <div className='bounce2' />
                      <div className='bounce3' />
                    </div>
                  </div>
                )
                :
                <div className='typing-status inactive'>
                  <div className='spinner'>
                    <div className='bounce1' />
                    <div className='bounce2' />
                    <div className='bounce3' />
                  </div>
                </div>
              }
            </div>
          </div>
          <div className='chat-input'>
            <InputField ref='inputField' type='chat' fromUsername={fromUsername} channelName={this.props.channelName} disableLinkPreview sendByEnter rows={1} pickerPosition='up' submitMessage={this.onSendMessage} />
          </div>
        </div>
      );
    }
  }
}

export default withApollo(hoc(ChatBox));
