/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import Avatar from 'material-ui/Avatar';
import IconFace from 'material-ui/svg-icons/action/face';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

class BubbleMembers extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      people: [],
      user_avatar: '',
      loadedMore: false,
    };

  }

  componentWillMount() {
    this.listenPusher();
  }

  componentWillUnmount() {
    this.unlistenPusher();
  }

  listenPusher = () => {
    const self = this;
    const channel = this.context.userChannel;
    channel.bind('avatar_changed', this.handleAvatarChanged);
    channel.bind('friend_avatar_changed', this.handleFriendAvatarChanged);

    const pusher = this.context.pusher;
    let bubbleChannel = pusher.channels.channels['private-bubble-' + this.props.bubble.permalink];
    if (!bubbleChannel) {
      bubbleChannel = pusher.subscribe('private-bubble-' + this.props.bubble.permalink);
    }
    bubbleChannel.bind('member_joined', this.refresh);
    bubbleChannel.bind('member_left', this.refresh);
    bubbleChannel.bind('member_avatar_changed', this.refresh);
  }

  unlistenPusher = () => {
    const channel = this.context.userChannel;
    channel.unbind('avatar_changed', this.handleAvatarChanged);
    channel.unbind('friend_avatar_changed', this.handleFriendAvatarChanged);

    const pusher = this.context.pusher;
    const bubbleChannel = pusher.channels.channels['private-bubble-' + this.props.bubble.permalink];
    if (bubbleChannel) {
      bubbleChannel.unbind('member_joined', this.refresh);
      bubbleChannel.unbind('member_left', this.refresh);
      bubbleChannel.unbind('member_avatar_changed', this.refresh);
    }
  }

  handleAvatarChanged = (data) => {
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const newObj = {};
    newObj['user_avatar_' + user.username] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  handleFriendAvatarChanged = (data) => {
    const newObj = {};
    newObj['user_avatar_' + data.user_data.username] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  refresh = (data) => {
    this.props.data.refetch();
  }

  loadMorePeople = () => {
    let _people = this.state.people;
    if (!_people.length) {
      _people = this.props.data.bubbleMembers.edges;
    }
    if (!_people.length) {
      return;
    }

    if (this.state.loadedMore) {
      this.setState({
        people: [],
        loadedMore: false,
      });
      this.props.data.refetch();
    }
    else {
      this.props.client.query({
        query: gql`
          query getBubbleMembers($bubble_id: Int!, $version: String!) {
            bubbleMembers(first: 20, bubble_id: $bubble_id) {
              edges {
                cursor
                node {
                  id
              	  username
                  avatar_url(version: $version)
                }
              }
            }
          }
        `,
        variables: {
          bubble_id: parseInt(this.props.bubble.id),
          version: 'micro',
        },
        forceFetch: true,
      }).then((graphQLResult) => {

        const { errors, data } = graphQLResult;

        if (errors) {
          if (errors.length > 0) {
            notify.show(errors[0].message, 'error', 2000);
          }
        }
        else {
          // Update feed data
          this.setState({
            loadedMore: true,
            people: data.bubbleMembers.edges,
          });
        }

      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });

    }
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
    if (!this.props.data.bubbleMembers) {
      return (
        <div>
          Bubble members loading...
        </div>
      );
    }
    else {
      const bubbleMembers = this.state.people.length ? this.state.people : this.props.data.bubbleMembers.edges;

      let view_more = null;
      if (bubbleMembers.length >= 7) {
        view_more = <a className='view_more' onClick={this.loadMorePeople.bind(this)}>View more</a>;
        if (this.state.loadedMore) {
          view_more = <a className='view_more' onClick={this.loadMorePeople.bind(this)}>View less</a>;
        }
      }

      const onlineUsers = JSON.parse(this.props.onlineUsers);
      const onlineUsersLinks = [];
      const offlineUsersLinks = [];

      bubbleMembers.map((user, index) => {
        const avatarUrl = this.state['user_avatar_' + user.node.username] ? this.state['user_avatar_' + user.node.username] : user.node.avatar_url;
        const isUserOnline = onlineUsers && onlineUsers[user.node.id];
        let username = `${user.node.username}`;
        if (username.length > 7) {
          username = `${username.substring(0, 7)}...`;
        }

        const userLink = <span className='stat-item' key={index}>
          <div className='friend-wrapper'>
            <Link to={`/u/${user.node.username}`}>
              <img src={avatarUrl} />
              {
                isUserOnline ?
                <div style={{ ...CommonStyles.presence.statusStyle, ...CommonStyles.presence.onlineStyle, left: 'auto', right: 2, bottom: -12 }} />
                :
                <div style={{ ...CommonStyles.presence.statusStyle, ...CommonStyles.presence.offlineStyle, left: 'auto', right: 2, bottom: -12 }} />
              }
            </Link>
            <div className='friend-info'>
              <Link className='friend-name' to={`/u/${user.node.username}`}>
                {username}
              </Link>
            </div>
          </div>
        </span>;

        if (isUserOnline) {
          onlineUsersLinks.push(userLink);
        }
        else {
          offlineUsersLinks.push(userLink);
        }
      });

      return (
        <div style={{ marginBottom: 20 }}>
          <div className='right-wrapper'>
            <div className='right-sidebar-box'>
              <div className='mui--clearfix'>
                {onlineUsersLinks}
                {offlineUsersLinks}
              </div>
              {view_more}
            </div>
          </div>
        </div>
      );
    }
  }
}

export default withApollo(hoc(BubbleMembers));
