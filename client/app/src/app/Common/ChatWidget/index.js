/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';
import { notify } from 'react-notify-toast';
import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';

import InputField from '@common/InputField';
import ChatBoxItem from '@common/ChatBoxItem';
import CreateChannel from '@common/CreateChannel';
import CommonStyles from '@utils/CommonStyles';

import hoc from './hoc';

class ChatWidget extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    callFunctions: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.shouldScrollToBottom = false;

    this.state = {
      chatinput: '',
      history: [],
      chatWidgetOnlineUsers: JSON.stringify({ }),
      typingUsername: '',
      activeTyping: false,
      lostFocus: false,
      messagesContainerHeight: 600,
      channels: [],
      privateChannels: [],
      activeChannelId: 0,
      activeChannel: {},
      openCreateChannelDialog: false,
      openAvatarMenu: false,
      avatarMenuAnchorElement: null,
      avatarMenuOnFriend: false,
      avatarMenuUser: {},
      channelNameEditing: false,
      inviteUserMenuOpen: false,
    };
  }

  clearCounters = () => {
    this.props.changeCounter({
      ...this.props.counters,
      chat_unread_items_count: 0,
    });
  }

  getChannels = () => {
    const channelsState = this.state.channels;
    const channelsProps = this.props.data.loading ? [] : this.props.data.chat_widget.channels.edges;
    return channelsState.length > 0 ? channelsState : channelsProps;
  }

  getChannel = (id) => {
    let channels = this.getChannels();
    let channel = channels.find(_channel => parseInt(_channel.node.id) === parseInt(id));
    if (channel) {
      return channel;
    }
    channels = this.getPrivateChannels();
    return channels.find(_channel => parseInt(_channel.node.id) === parseInt(id));
  }

  getPrivateChannels = () => {
    const channelsState = this.state.privateChannels;
    const channelsProps = this.props.data.loading ? [] : this.props.data.chat_widget.private_channels.edges;
    return channelsState.length > channelsProps.length ? channelsState : channelsProps;
  }

  getHistory = () => {
    return this.state.history;
  }

  subscribeToPusherChannel = () => {
    const pusher = this.context.pusher;
    const { chatWidgetId } = this.props;
    let channel = pusher.channels.channels['private-chatwidget-' + chatWidgetId];
    if (!channel) {
      channel = pusher.subscribe('private-chatwidget-' + chatWidgetId);
    }
    channel.bind('message_created', this.onMessageCreated);
    channel.bind('channel_created', this.onChannelCreated);
    channel.bind('channel_renamed', this.onChannelRenamed);
    channel.bind('channel_removed', this.onChannelRemoved);
    channel.bind('invited_to_channel', this.onInvitedToChannel);
    channel.bind('client-typing_status', this.onClientTypingStatus);
  }

  unsubscribeFromPusherChannel = () => {
    const pusher = this.context.pusher;
    const { chatWidgetId } = this.props;
    const channel = pusher.channels.channels['private-chatwidget-' + chatWidgetId];
    if (channel) {
      channel.unbind('message_created', this.onMessageCreated);
      channel.unbind('channel_created', this.onChannelCreated);
      channel.unbind('channel_renamed', this.onChannelRenamed);
      channel.unbind('channel_removed', this.onChannelRemoved);
      channel.unbind('client-typing_status', this.onClientTypingStatus);
    }
    // pusher.unsubscribe('private-chatwidget-' + chatWidgetId);
  }

  subscribeToChatWidgetPresenceChannel = () => {
    const pusher = this.context.pusher;

    if (this.chatWidgetPresenceChannel) {
      this.chatWidgetPresenceChannel.unbind('pusher:subscription_succeeded', this.handleChatWidgetPresenceEvent);
      this.chatWidgetPresenceChannel.unbind('pusher:member_added', this.handleChatWidgetPresenceEvent);
      this.chatWidgetPresenceChannel.unbind('pusher:member_removed', this.handleChatWidgetPresenceEvent);
      pusher.unsubscribe(this.chatWidgetPresenceChannel.name);
    }

    const { activeChannelId } = this.state;
    if (!activeChannelId) {
      return;
    }
    let chatWidgetPresenceChannel = pusher.channels.channels['presence-chatwidget-online-users-channel-' + activeChannelId];
    if (!chatWidgetPresenceChannel) {
      chatWidgetPresenceChannel = pusher.subscribe('presence-chatwidget-online-users-channel-' + activeChannelId);
    }

    this.chatWidgetPresenceChannel = chatWidgetPresenceChannel;
    this.chatWidgetPresenceChannel.bind('pusher:subscription_succeeded', this.handleChatWidgetPresenceEvent);
    this.chatWidgetPresenceChannel.bind('pusher:member_added', this.handleChatWidgetPresenceEvent);
    this.chatWidgetPresenceChannel.bind('pusher:member_removed', this.handleChatWidgetPresenceEvent);

    setTimeout(() => {
      this.handleChatWidgetPresenceEvent();
    }, 10);

  }

  unsubscribeFromChatWidgetPresenceChannel = () => {
    const pusher = this.context.pusher;

    const { activeChannelId } = this.state;
    if (this.chatWidgetPresenceChannel) {
      this.chatWidgetPresenceChannel.unbind('pusher:subscription_succeeded', this.handleChatWidgetPresenceEvent);
      this.chatWidgetPresenceChannel.unbind('pusher:member_added', this.handleChatWidgetPresenceEvent);
      this.chatWidgetPresenceChannel.unbind('pusher:member_removed', this.handleChatWidgetPresenceEvent);
      pusher.unsubscribe('presence-chatwidget-online-users-channel-' + activeChannelId);
    }
  }

  handleChatWidgetPresenceEvent = () => {
    if (!this.chatWidgetPresenceChannel) {
      return;
    }
    this.setState({
      chatWidgetOnlineUsers: JSON.stringify(this.chatWidgetPresenceChannel.members.members),
    });
  }

  onMessageCreated = (data) => {
    if (data.message.channel_id !== this.state.activeChannelId) {
      return;
    }

    const username = JSON.parse(localStorage.getItem('mbubblz_user')).username;
    const historyStateInit = this.getHistory();
    const historyState = JSON.parse(JSON.stringify(historyStateInit));

    historyState.push({
      node: {
        text: data.message.text,
        created_at: data.message.created_at,
        author: {
          __typename: 'User',
          avatar_url: data.message.author.thumb_avatar_url,
          username: data.message.author.username,
        },
        medium: {
          id: data.message.media.id,
          type: data.message.media.type,
          thumb_url: data.message.media.thumb_url,
          picture_url: data.message.media.picture_url,
          video_links: data.message.media.video_links,
          recoding_job_id: data.message.media.recoding_job_key,
        },
        link_preview: data.message.link_preview,
      },
    });
    this.shouldScrollToBottom = true;
    this.setState({
      history: historyState,
    });
  }

  onChannelCreated = (data) => {
    if (data.channel) {
      if (data.channel.type === 'global') {
        const channels = this.getChannels();
        const _channels = channels.slice();
        _channels.push({
          node: data.channel,
        });
        this.setState({
          channels: _channels,
        });
      }
      else {
        console.log(data.channel);///
        const channels = this.getPrivateChannels();
        const _channels = channels.slice();
        _channels.push({
          node: data.channel,
        });
        this.setState({
          privateChannels: _channels,
        });
      }
    }
  }

  onChannelRenamed = (data) => {
    const channels = this.getChannels();
    const _channels = channels.slice();
    for(let i = 0; i < _channels.length; i++) {
      if (parseInt(_channels[i].node.id) === parseInt(data.channel.id)) {
        const node = Object.assign({}, _channels[i].node, {
          name: data.channel.name
        });
        _channels[i] = Object.assign({}, _channels[i], {
          node,
        });
        this.setState({
          channels: _channels,
          _v: Math.random(),
        });
        break;
      }
    }
  }

  onChannelRemoved = (data) => {
    this.removeChannelFromState(data.channel_id);
  }

  removeChannelFromState = (channelId) => {
    const channels = this.getChannels();
    const _channels = channels.slice();
    for(let i = 0; i < _channels.length; i++) {
      if (parseInt(_channels[i].node.id) === parseInt(channelId)) {
        _channels.splice(i, 1);
        this.setState({
          channels: _channels,
          _v: Math.random(),
        });
        break;
      }
    }
  }

  onInvitedToChannel = (data) => {
    const { user_id } = data;
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    if (user && parseInt(user_id) === parseInt(user.id)) {
      const channels = this.getPrivateChannels();
      const _channels = channels.slice();
      _channels.push({
        node: data.channel,
      });
      this.setState({
        privateChannels: _channels,
      });
    }
  }

  onClientTypingStatus = (data) => {
    const username = JSON.parse(localStorage.getItem('mbubblz_user')).username;
    if (data.typing) {
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

  onSendMessage = (vars) => {
    const { chatWidgetId } = this.props;
    const { activeChannelId } = this.state;
    if (!activeChannelId) {
      return;
    }
    vars.chat_id = chatWidgetId;
    vars.channel_id = activeChannelId;
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
        this.shouldScrollToBottom = true;
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
    // var container = $('#myb-chatbar-box-' + self.props.friend.username);
    if (e.target.tagName.toLowerCase() === 'input') {
      e.stopPropagation();
      return;
    }
    const container = $(ReactDOM.findDOMNode(this));
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

  onWindowResize = () => {
    const msgbox = ReactDOM.findDOMNode(this);
    if (msgbox) {
      const msgboxSize = msgbox.getBoundingClientRect();
      const msgHeight = window.innerHeight - msgboxSize.top;
      this.setState({
        messagesContainerHeight: msgHeight,
      });
    }
  }

  startGroupCall = () => {
    const { activeChannelId } = this.state;
    if (activeChannelId) {
      const { callFunctions } = this.context;
      const { bubble } = this.props;
      callFunctions.startGroupCall(activeChannelId, bubble.name, bubble.avatar_url);
    }
  }

  openChannel = (channelId, channel = null) => {
    this.setState({
      activeChannelId: parseInt(channelId),
      activeChannel: channel ? channel : this.getChannel(channelId),
      channelNameEditing: false,
    }, () => {
      this.subscribeToChatWidgetPresenceChannel();
    });
    this.props.client.query({
      query: gql`
        query channel($id: ID!) {
          chat_widget_channel(id: $id) {
            history(first: 50, order_by: "date") {
              edges {
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
                    type
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
      variables: {
        id: channelId,
      },
      activeCache: false,
      forceFetch: true,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 5000);
        }
        else if (errors.message) {
          notify.show(errors.message, 'error', 5000);
        }
      }
      else {
        this.shouldScrollToBottom = true;
        this.setState({
          history: data.chat_widget_channel.history.edges,
        });
      }
    }).catch((error) => {
      console.log(error);
      notify.show(error.message ? error.message : 'Unexpected error', 'error', 5000);
    });
  }

  openChannelDialog = () => {
    this.setState({
      openCreateChannelDialog: true,
    })
  }

  handleOnCloseChannelDialog = () => {
    this.setState({
      openCreateChannelDialog: false,
    });
  }

  handleOnClickUserAvatar = (avatarElement, user) => {
    const username = JSON.parse(localStorage.getItem('mbubblz_user')).username;
    const isFriend = (user.username !== username);
    this.setState({
      openAvatarMenu: true,
      avatarMenuAnchorElement: avatarElement,
      avatarMenuOnFriend: isFriend,
      avatarMenuUser: user,
    });
  }

  handleOnClickViewProfile = () => {
    const { avatarMenuUser } = this.state;
    if (avatarMenuUser) {
      this.props.router.push(`/u/${avatarMenuUser.username}`);
    }
  }

  handleOnCloseAvatarMenu = () => {
    this.setState({
      openAvatarMenu: false,
      avatarMenuAnchorElement: null,
    });
  }

  openPrivateChannel = () => {
    const { chatWidgetId } = this.props;
    const { avatarMenuUser } = this.state;

    setTimeout(() => {
      this.handleOnCloseAvatarMenu();
    }, 300);

    const channels = this.getPrivateChannels();
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    for(let i = 0; i < channels.length; i++) {
      const members = channels[i].node.members.edges;
      if (
        (members.length > 0 && parseInt(members[0].node.id) == parseInt(avatarMenuUser.id))
        || (members.length > 1 && (parseInt(members[0].node.id) == parseInt(user.id) && parseInt(members[1].node.id) == parseInt(avatarMenuUser.id)))
      ) {
        this.openChannel(channels[i].node.id);
        return;
      }
    }
    return;

    this.props.createChannel({ variables: {
      chat_id: chatWidgetId,
      name: '',
      type: 'privy',
      user_id: parseInt(avatarMenuUser.id),
    } }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        notify.show(errors.message ? errors.message : errors[0].message, 'error');
      }
      else {
        this.openChannel(data.channel.id);
        ReactGA.event({
          category: 'Chat',
          action: 'Created a private channel',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  beginEditingChannelName = () => {
    const { bubble } = this.props;
    if (bubble.user_role === 'guest') {
      return;
    }
    const { activeChannel } = this.state;
    if (activeChannel.node.kind === 'privy') {
      return;
    }
    this.setState({
      channelNameEditing: true,
    }, () => {
      this.refs.channelNameInput.value = activeChannel.node.name;
    });
  }

  handleOnChannelNameInputKeyDown = (e, v) => {
    if (e.keyCode == 27) {
      e.preventDefault();
      this.setState({
        channelNameEditing: false,
      });
    } else if (e.keyCode == 13) {
      e.preventDefault();
      const newName = this.refs.channelNameInput.value;
      const { activeChannelId } = this.state;
      if (!newName || !activeChannelId) {
        return;
      }
      this.refs.channelNameInput.disabled = true;
      this.props.renameChannel({ variables: {
        channel_id: activeChannelId,
        new_name: newName,
      } }).then((graphQLResult) => {
        const { errors, data } = graphQLResult;
        if (errors) {
          notify.show(errors.message ? errors.message : errors[0].message, 'error');
        }
        else {
          let { activeChannel } = this.state;
          const _node = Object.assign({}, activeChannel.node, {
            name: newName,
          });
          activeChannel = Object.assign({}, activeChannel, {
            node: _node,
          });
          // activeChannel.node.name = newName;
          this.setState({
            channelNameEditing: false,
            activeChannel,
          });
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
  }

  removeChannel = () => {
    const { activeChannelId, activeChannel } = this.state;
    const channels = this.getChannels();
    if (activeChannel.node.kind === 'global' && channels.length <= 1) {
      notify.show('Can not remove all public channels', 'error');
      return;
    }
    this.props.removeChannel({
      variables: {
        channel_id: parseInt(activeChannelId),
      },
    })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        notify.show(errors.message ? errors.message : errors[0].message, 'error');
      } else {
        this.removeChannelFromState(activeChannelId);
        const channels = this.getChannels();
        if (channels.length > 0) {
          this.openChannel(channels[0].node.id);
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  inviteUsersToPrivateChannel = () => {
    this.setState({
      inviteUserMenuOpen: true,
    });
  }

  handleOnCloseInviteMenu = () => {
    this.setState({
      inviteUserMenuOpen: false,
    });
  }

  handleOnInviteUser = (member) => {
    this.setState({
      inviteUserMenuOpen: false,
    });
    const { activeChannelId } = this.state;
    this.props.addUserToPrivateChannel({ variables: {
      channel_id: parseInt(activeChannelId),
      user_id: parseInt(member.node.id),
    }});
  }

  componentWillMount() {
    this.shouldScrollToBottom = true;
    this.subscribeToPusherChannel();
    this.subscribeToChatWidgetPresenceChannel();
    document.addEventListener('mouseup', this.handleFocusEvent);
    if (this.props.counters) {
      this.clearCounters();
    }
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
    this.unsubscribeFromChatWidgetPresenceChannel();
    document.removeEventListener('mouseup', this.handleFocusEvent);
    window.removeEventListener('resize', this.onWindowResize);
  }

  componentDidUpdate() {
    if (this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      setTimeout(() => {
        const chatsContainer = this.refs.chatsContainer;
        if (chatsContainer) {
          this.scrollTo(chatsContainer, chatsContainer.scrollHeight, 150);
        }
      }, 100);
    }
  }

  componentDidMount() {
    const chatbox = this.refs.chatbox;
    if (chatbox) {
      chatbox.addEventListener('scroll', function(event) {
        event.stopPropagation();
      });
    }
    window.addEventListener('resize', this.onWindowResize);
    setTimeout(() => {
      this.onWindowResize();
    }, 10);
  }

  componentWillReceiveProps(nextProps) {
    setTimeout(() => {
      const el = ReactDOM.findDOMNode(this);
      if (el) {
        $(el).find('.new-message-input').focus();
      }
    }, 100);
    // Open default channel if no channels are opened
    if (!this.props.data.chat_widget && nextProps.data.chat_widget && !this.state.activeChannelId) {
      const channels = nextProps.data.chat_widget.channels.edges;
      let channelToOpen = null;
      if (channels.length > 0) {
        // First try to open the channel named 'general'
        channelToOpen = channels.find(channel => channel.node.name === 'general');
        // If no channel is named 'general' then open first one
        if (!channelToOpen) {
          channelToOpen = channels[0];
        }
        if (channelToOpen) {
          this.openChannel(channelToOpen.node.id, channelToOpen);
        }
      }
    }
  }

  backToConversations = () => {
    this.setState({
      activeChannelId: 0,
    });
  }

  render() {
    if (this.props.data.errors) {
      if (this.props.data.errors.graphQLErrors && this.props.data.errors.graphQLErrors[0].message === 'User is unauthorized') {
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
    const activeChannelStyle = {
      fontWeight: 700,
      width: 250,
    };
    const inactiveChannelStyle = {
      width: 250,
    };
    const chatWidgetTopbarStyle = {
      padding: '13px 18px',
      position: 'relative',
      fontSize: '0.85em',
      color: '#c0c0c1',
      borderBottom: '1px solid #f0f0f1',
    };
    const membersIconStyle = {
      width: 16,
      height: 16,
      color: '#c0c0c1',
      verticalAlign: '-21%',
      marginRight: 5,
    };
    const callButtonContainerStyle = {
      position: 'absolute',
      right: 18,
      top: 10,
    };
    const callButtonStyle = {
      height: 25,
      boxShadow: 'none',
    };
    const callButtonLabelStyle = {
      fontSize: 13,
      fontWeight: 400,
      textTransform: 'none',
    };
    const { bubble, chatWidgetId } = this.props;
    const username = JSON.parse(localStorage.getItem('mbubblz_user')).username;
    const { chat_widget, bubbleMembers } = this.props.data;
    const {
      messagesContainerHeight,
      openAvatarMenu, avatarMenuAnchorElement, avatarMenuOnFriend,
      activeChannel, activeChannelId,
      channelNameEditing,
      inviteUserMenuOpen,
    } = this.state;
    const onlineUsers = JSON.parse(this.state.chatWidgetOnlineUsers);
    const channels = this.getChannels();
    const privateChannels = this.getPrivateChannels();
    const history = this.getHistory();
    let onlineUsersCount = 0;
    for (const key in onlineUsers) {
      onlineUsersCount++;
    }
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

    return (
      <div className='myb-messages-box chatwidget' style={{ height: messagesContainerHeight }}>
        <div className='topbar'>
          <FlatButton
            className={this.state.openChatFriendId > 0 ? 'myb-small-button selected' : 'myb-small-button'}
            backgroundColor={topBtnBgColor}
            hoverColor={topBtnBgColor}
            style={{ ...topBtnStyle, border: 'none', borderBottom: topBtnBorder }}
            onClick={this.backToConversations}
          >
            {activeChannelId > 0 && $(window).width() < 768 ? 'Back' : 'Channels'}
          </FlatButton>
          {
            activeChannelId > 0 && bubble.user_role !== 'guest' && <div style={{ padding: '15px 20px 0', display: 'inline-block',
            float: 'right',
            marginTop: -10, }}>
              <RaisedButton
                primary
                label='Create Channel'
                style={callButtonStyle}
                labelStyle={callButtonLabelStyle}
                onClick={this.openChannelDialog}
              />
            </div>
          }
        </div>
        <div className={activeChannelId > 0 ? 'channels-area selected' : 'channels-area'} ref='channels'>
          {
            bubble.user_role !== 'guest' && <div style={{ padding: '15px 20px 0' }}>
              <RaisedButton
                primary
                label='Create Channel'
                style={callButtonStyle}
                labelStyle={callButtonLabelStyle}
                onClick={this.openChannelDialog}
              />
            </div>
          }
          <Menu desktop={true} width={250}>
            {
              channels.map(channel => {
                return (
                  <MenuItem
                    key={channel.node.name}
                    primaryText={(<span>
                      # {channel.node.name}
                    </span>)}
                    style={activeChannelId == channel.node.id ? activeChannelStyle : inactiveChannelStyle}
                    onClick={this.openChannel.bind(this, channel.node.id, null)}
                  />
                );
              })
            }
            <div style={{ marginTop: 15 }} />
            {
              privateChannels.map(channel => {
                return (
                  <MenuItem
                    key={channel.node.id}
                    primaryText={(<span>
                      <span dangerouslySetInnerHTML={{ __html: '&bull;' }} /> {channel.node.name}
                    </span>)}
                    style={activeChannelId == channel.node.id ? activeChannelStyle : inactiveChannelStyle}
                    onClick={this.openChannel.bind(this, channel.node.id, null)}
                  />
                );
              })
            }
          </Menu>
        </div>
        <div className={activeChannelId > 0 ? 'chat-area selected' : 'chat-area'} ref='chatbox'>
          <div style={chatWidgetTopbarStyle}>
            {
              activeChannel.node ?
              (<span>
                <strong style={{ color: '#333' }}>
                  {
                    activeChannel.node.kind === 'privy' ?
                    <span dangerouslySetInnerHTML={{ __html: '&bull;' }} />
                    :
                    '#'
                  }
                </strong>
                <span> </span>
                {
                  channelNameEditing ?
                  <input
                    type="text"
                    ref="channelNameInput"
                    onKeyDown={this.handleOnChannelNameInputKeyDown}
                    defaultValue={activeChannel.node.name} />
                  :
                  <strong style={{ color: '#333' }}>
                    <span onClick={this.beginEditingChannelName}>
                      {activeChannel.node.name}
                    </span>
                  </strong>
                } ({onlineUsersCount ? onlineUsersCount : 1})
              </span>)
              :
              <em dangerouslySetInnerHTML={{ __html: '&nbsp;' }} />
            }
            <div style={callButtonContainerStyle}>
              {
                activeChannel.node && bubble.user_role !== 'guest' && (
                  <span style={{ display: 'inline-block', marginRight: 10 }}>
                    <RaisedButton
                      secondary
                      label='Remove Channel'
                      style={callButtonStyle}
                      labelStyle={callButtonLabelStyle}
                      onClick={this.removeChannel} />
                  </span>
                )
              }
              {
                activeChannel.node && activeChannel.node.kind == 'privy' && (
                  <span style={{ display: 'inline-block', marginRight: 10 }} ref='inviteUserButton'>
                    <RaisedButton
                      primary
                      label='Invite Users'
                      style={callButtonStyle}
                      labelStyle={callButtonLabelStyle}
                      onClick={this.inviteUsersToPrivateChannel} />
                  </span>
                )
              }
              {
                activeChannel.node && activeChannel.node.kind == 'privy' && inviteUserMenuOpen && (
                  <Popover
                    open={inviteUserMenuOpen}
                    anchorEl={this.refs.inviteUserButton}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                    onRequestClose={this.handleOnCloseInviteMenu}
                  >
                    <Menu desktop={true}>
                      {
                        bubbleMembers.edges.map(member => {
                          if (!activeChannel.node.members.edges.find(
                            channelMember => parseInt(channelMember.node.id) == parseInt(member.node.id)
                          )) {
                            return <MenuItem key={member.node.id} primaryText={member.node.username} onClick={this.handleOnInviteUser.bind(this, member)} />
                          }
                        })
                      }
                    </Menu>
                  </Popover>
                )
              }
              {
                !!activeChannelId && <RaisedButton
                  primary
                  label='Join Call'
                  style={callButtonStyle}
                  labelStyle={callButtonLabelStyle}
                  onClick={this.startGroupCall} />
              }
            </div>
          </div>
          <div className='chat-messages' ref='chatsContainer'>
            {history.map((chat, index) => {
              return (
                <ChatBoxItem
                  className='chat-message'
                  type='chat-widget'
                  key={index}
                  username={chat.node.author.username}
                  friendAvatar={chat.node.author.avatar_url}
                  chat={chat.node}
                  onClickAvatar={this.handleOnClickUserAvatar} />
              );
            })}
            <Popover
              open={openAvatarMenu}
              anchorEl={avatarMenuAnchorElement}
              anchorOrigin={avatarMenuOnFriend ? {horizontal: 'right', vertical: 'bottom'} : {horizontal: 'left', vertical: 'bottom'}}
              targetOrigin={avatarMenuOnFriend ? {horizontal: 'right', vertical: 'top'} : {horizontal: 'left', vertical: 'top'}}
              onRequestClose={this.handleOnCloseAvatarMenu}
            >
              <Menu desktop={true}>
                <MenuItem primaryText="View Profile" onClick={this.handleOnClickViewProfile} />
                {
                  avatarMenuOnFriend && (
                    <MenuItem primaryText="Private Message" onClick={this.openPrivateChannel} />
                  )
                }
              </Menu>
            </Popover>
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
          </div>

          <InputField ref='inputField' type='chat' disableLinkPreview sendByEnter
            rows={1} pickerPosition='up'
            submitMessage={this.onSendMessage}
          />
        </div>
        <Dialog
          title='Create Global Channel'
          modal={false}
          open={this.state.openCreateChannelDialog}
          onRequestClose={this.handleOnCloseChannelDialog}
          autoScrollBodyContent
          contentStyle={CommonStyles.dialog.content}
          bodyStyle={CommonStyles.dialog.body}
          titleStyle={CommonStyles.dialog.title}
          style={{ zIndex: 0, padding: 0 }}
        >
          <CreateChannel
            chatId={chatWidgetId}
            onRequestClose={this.handleOnCloseChannelDialog} />
        </Dialog>
      </div>
    );
  }

}

export default withApollo(hoc(ChatWidget));
