/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { notify } from 'react-notify-toast';
import gql from 'graphql-tag';
import ChatIcon from 'material-ui/svg-icons/communication/chat';

import InputField from '@common/InputField';
import ChatBoxItem from '@common/ChatBoxItem';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class MessagesContent extends Component {

  state = {
    history: [],
    typingUsername: '',
    activeTyping: false,
    lostFocus: false,
    infiniteLoading: false,
    allLoaded: false,
    mounted: false,
  }

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.shouldScrollToBottom = false;
  }

  notifSound = () => {
    const soundElements = [
      '/assets/afk.mp3',
    ];
    const music = new Audio(soundElements[0]);
    music.load();
    music.play();
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
    const historyProps = this.props.data.loading ? [] : this.cloneAndReverse(this.props.data.wheelchat.history.edges);
    // if (!this.props.data.loading) {
    //   this.shouldScrollToBottom = true;
    // }
    this.shouldScrollToBottom = true;
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
      // pusher.subscribe('private-messages_' + channelName);
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
    const username = JSON.parse(localStorage.getItem('mbubblz_user')).username;
    console.log(data);
    if (data.typing && this.state.mounted) {
      if (data.fromUsername !== username) {
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
    const historyStateInit = this.getHistory();
    const historyState = JSON.parse(JSON.stringify(historyStateInit));
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
    this.setState({
      history: historyState,
    });
    this.shouldScrollToBottom = true;
  }

  onSendMessage =(vars) => {
    const { channelName } = this.props;
    vars.channel_name = channelName;
    this.props.create_1v1_message({ variables: vars })
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
    if (this.props.onMessageSent) {
      this.props.onMessageSent(channelName);
    }
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
    // var container = $('#myb-chatbar-box-' + self.props.friend.username);
    const container = $(ReactDOM.findDOMNode(this));
    const self = this;

    if (!container.is(e.target) // if the target of the click isn't the container...
        && container.has(e.target).length === 0) // ... nor a descendant of the container
    {
      if (!self.state.lostFocus && self.props.open) {
        self.setState({
          lostFocus: true,
        });
        // self.notifSound();
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
    const historyStateInit = this.getHistory();
    let historyState = JSON.parse(JSON.stringify(historyStateInit));

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
            history(last: 30, after: $lastCursor, order_by: "date", reverse_order: true) {
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

  onCloseMessage = () => {
    if (this.props.onCloseMessage) {
      this.props.onCloseMessage();
    }
  }

  scrollChat = (timeout) => {
    if (this.props.open && this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      setTimeout(() => {
        const chatsContainer = this.refs.chatsContainer;
        if (chatsContainer) {
          this.scrollTo(chatsContainer, chatsContainer.scrollHeight, 150);
        }
      }, timeout);
    }
  }

  componentWillMount() {
    // this.shouldScrollToBottom = true;
    this.subscribeToPusherChannel();
    document.addEventListener('mouseup', this.handleFocusEvent);
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
    document.removeEventListener('mouseup', this.handleFocusEvent);
    this.setState({
      mounted: false,
    });
    this.onCloseMessage();
  }

  componentDidUpdate() {
    if (this.props.open && this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      setTimeout(() => {
        const chatsContainer = this.refs.chatsContainer;
        if (chatsContainer) {
          this.scrollTo(chatsContainer, chatsContainer.scrollHeight, 150);
        }
      }, 10);
    }
  }

  componentDidMount() {
    const chatbox = this.refs.chatbox;
    if (chatbox) {
      chatbox.addEventListener('scroll', function(event) {
        event.stopPropagation();
      });
    }
    this.setState({
      mounted: true,
    });
  }

  componentWillReceiveProps(nextProps) {
    setTimeout(() => {
      const el = ReactDOM.findDOMNode(this);
      if (el) {
        $(el).find('.new-message-input').focus();
      }
    }, 200);
  }

  render() {
    if (this.props.data.loading) {
      return (
        <div />
      );
    }
    else {

      const dialogOpenStyle = {
        height: this.props.contentHeight + 35,
      };
      const dialogHiddenStyle = {
        display: 'none',
      };

      const { open, friend, friendAvatar, userAvatar } = this.props;
      const username = friend.username;
      const history = this.getHistory();
      let messagesContent = '';
      if (history.length === 0) {
        messagesContent = (
          <div className='select-dialog'>
            <div>
              <ChatIcon style={{ width: 64, height: 64 }} color='#e4e4e4'/>
              <div>Type your first message!</div>
            </div>
          </div>
        );
      }
      else {
        messagesContent = (
          <div className='chat-messages' ref='chatsContainer' onScroll={this.handleScroll}>
              {history.map((chat, index) => {
                const chatAvatar = (chat.node.author.username === friend.username) ? friendAvatar : userAvatar;
                return (
                  <ChatBoxItem
                    className='chat-message'
                    type='chat-widget'
                    key={index}
                    username={friend.username}
                    friendAvatar={chatAvatar}
                    chat={chat.node} />
                );
              })}
            </div>
          );
      }
      return (
          <div className='chat-messages-wrapper' ref='chatbox' style={ open ? dialogOpenStyle : dialogHiddenStyle}>
            {messagesContent}
            {username === this.state.typingUsername ?
              (
                this.state.activeTyping ?
                <div className='typing-status'>
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
            <InputField ref='inputField' type='chat' disableLinkPreview sendByEnter rows={1} pickerPosition='up' submitMessage={this.onSendMessage} />
          </div>
      );
    }
  }
}

export default withApollo(hoc(MessagesContent));
