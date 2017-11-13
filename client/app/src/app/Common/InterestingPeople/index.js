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

class InterestingPeople extends Component {
  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
    chatFunctions: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      people: [],
    };

    this.subscribedToPusher = false;
  }

  componentWillMount = () => {
    this.context.chatFunctions.addChatUpdateComponent(this);
  }

  componentWillUnmount = () => {
    this.unlistenPusher();
    this.context.chatFunctions.removeChatUpdateComponent(this);
  }

  componentDidUpdate = () => {
    this.listenPusher();
  }

  listenPusher = () => {
    if (!this.props.data.interesting_users) {
      return;
    }
    if (this.subscribedToPusher) {
      return;
    }
    const pusher = this.context.pusher;
    const interesting_users = this.state.people.length ? this.state.people : this.props.data.interesting_users.edges;
    this.subscribedToPusher = true;
    interesting_users.map(user => {
      let userChannel = pusher.channels.channels['private-user-' + user.node.id];
      if (!userChannel) {
        userChannel = pusher.subscribe('private-user-' + user.node.id);
      }
      userChannel.bind('avatar_changed', this.handleAvatarChanged);
    });
  }

  unlistenPusher = () => {
    if (!this.subscribedToPusher) {
      return;
    }
    if (!this.props.data.interesting_users) {
      return;
    }
    const pusher = this.context.pusher;
    const interesting_users = this.state.people.length ? this.state.people : this.props.data.interesting_users.edges;
    interesting_users.map(user => {
      const userChannel = pusher.channels.channels['private-user-' + user.node.id];
      if (userChannel) {
        userChannel.unbind('avatar_changed', this.handleAvatarChanged);
        pusher.unsubscribe('private-user-' + user.node.id);
      }
    });
  }

  handleAvatarChanged = (data) => {
    const newObj = {};
    newObj['user_avatar_' + data.user_data.username] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  loadMorePeople = () => {
    let _people = this.state.people;
    if (!_people.length) {
      _people = this.props.data.interesting_users.edges;
    }
    if (!_people.length) {
      return;
    }

    if (this.props.viewMore) {
      this.unlistenPusher();
      this.subscribedToPusher = false;
      this.setState({
        people: [],
      });
      this.props.onClickViewMore(false);
      this.props.data.refetch();
    }
    else {
      this.props.client.query({
        query: gql`
          query getInterestingPeople($version: String!) {
            interesting_users(first: 12) {
              edges {
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
          version: 'micro',
        },
        activeCache: false,
        forceFetch: true,
      }).then((graphQLResult) => {

        const { errors, data } = graphQLResult;

        if (errors) {
          if (errors.length > 0) {
            notify.show(errors[0].message, 'error', 2000);
          }
        }
        else {
          this.unlistenPusher();
          this.subscribedToPusher = false;
          // Update feed data
          this.setState({
            people: data.interesting_users.edges,
          });
          this.props.onClickViewMore(true);
        }

      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });

    }
  }

  render() {

    if (!this.props.data.interesting_users) {
      return (
        <div>
          Interesting people loading...
        </div>
      );
    }
    else {
      const interesting_users = this.state.people.length && this.props.viewMore ? this.state.people : this.props.data.interesting_users.edges;
      const buttonStyle = {
        minWidth: 66,
        height: 26,
        lineHeight: 16,
        fontSize: 13,
        backgroundColor: '#62db95',
        color: '#ffffff',
        border: 10,
        margin: '4px 0px 0px',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        display: 'block',
        width: 88,
        padding: '6px 8px',
      };
      const titleStyle = {
        fontSize: 15,
        color: '#686868',
        textTransform: 'uppercase',
        marginBottom: '8px',
      };
      const avatarContainerStyle = {
        marginRight: 12,
        marginBottom: 12,
        position: 'relative',
        float: 'left',
        color: '#000',
      };
      let view_more = null;
      if (interesting_users.length >= 3) {
        view_more = <a className='view_more' onClick={this.loadMorePeople.bind(this)}>View more</a>;
        if (this.props.viewMore) {
          view_more = <a className='view_more' onClick={this.loadMorePeople.bind(this)}>View less</a>;
        }
      }

      const _onlineUsers = this.context.chatFunctions.getChatState().onlineUsers;
      const onlineUsers = _onlineUsers ? JSON.parse(_onlineUsers) : null;

      return (
        <div style={{ marginBottom: 16 }}>
          <div style={titleStyle}>
            <IconFace color='#686868' style={{ verticalAlign: '-30%', marginRight: '4px' }}/>People
          </div>
          <div className='mui--clearfix'>
            <div className='inner-wrapper'>
              {interesting_users.length === 0 ? 'People not found yet' : null}
              {interesting_users.map((user, index)=>{
                const avatarUrl = this.state['user_avatar_' + user.node.username] ? this.state['user_avatar_' + user.node.username] : user.node.avatar_url;
                let username = `${user.node.username}`;
                if (username.length > 7) {
                  username = `${username.substring(0, 7)}...`;
                }
                return (
                  <Link key={index} style={avatarContainerStyle} to={`/u/${user.node.username}`}>
                    <div className='avatar-wrapper'>
                      <Avatar src={avatarUrl} />
                      {
                        onlineUsers ?
                        (
                          onlineUsers[user.node.id] ?
                          <div style={{ ...CommonStyles.presence.statusStyle, ...CommonStyles.presence.onlineStyle, left: 'auto', right: '0px', bottom: 'auto', top: '28px' }} />
                          :
                          <div style={{ ...CommonStyles.presence.statusStyle, ...CommonStyles.presence.offlineStyle, left: 'auto', right: '0px', bottom: 'auto', top: '28px' }} />
                        )
                        :
                        ''
                      }
                    </div>
                    <div className='username-wrapper'>{username}</div>
                  </Link>
                );
              })}
            </div>
          </div>
          {view_more}
        </div>
      );
    }
  }
}

export default withApollo(hoc(InterestingPeople));
