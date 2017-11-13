/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactGA from 'react-ga';
import moment from 'moment';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import IconMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import BubbleManageTopBar from '../BubbleManageTopBar';

import CommonStyles from '@utils/CommonStyles';
import hoc from './hoc';

class BubbleManageUsers extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  state = {
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

  removeMember = (memberId) => {
    this.props.removeMember({ variables: {
      bubble_id: parseInt(this.props.bubble.id),
      member_id: parseInt(memberId),
    } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        const message = errors.message ? errors.message : errors[0].message;
        notify.show(message, 'error');
      }
      else {
        ReactGA.event({
          category: 'Bubble',
          action: 'Removed a member',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  makeAdmin = (memberId) => {
    this.props.makeAdmin({ variables: {
      bubble_id: parseInt(this.props.bubble.id),
      member_id: parseInt(memberId),
    } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        const message = errors.message ? errors.message : errors[0].message;
        notify.show(message, 'error');
      }
      else {
        ReactGA.event({
          category: 'Bubble',
          action: 'Made a user an admin',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  banMember = (memberId) => {
    this.props.banMember({ variables: {
      bubble_id: parseInt(this.props.bubble.id),
      member_id: parseInt(memberId),
    } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        const message = errors.message ? errors.message : errors[0].message;
        notify.show(message, 'error');
      }
      else {
        ReactGA.event({
          category: 'Bubble',
          action: 'Banned a member',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  unbanMember = (userId) => {
    this.props.unbanMember({ variables: {
      bubble_id: parseInt(this.props.bubble.id),
      user_id: parseInt(userId),
    } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        const message = errors.message ? errors.message : errors[0].message;
        notify.show(message, 'error');
      }
      else {
        ReactGA.event({
          category: 'Bubble',
          action: 'Unbanned a member',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  userItem = (key, userNode, isLast, menu) => {
    const avatar = (
      this.state['user_avatar_' + userNode.username] ?
      this.state['user_avatar_' + userNode.username]
      :
      userNode.avatar_url
    );
    return (
      <div key={key} style={{ ...CommonStyles.bubbleManage.userStyle, ...(!isLast ? CommonStyles.bubbleManage.userBottomBorderStyle : { }) }}>
        <Link to={userNode.username}>
          <img src={userNode.avatar_url} style={CommonStyles.bubbleManage.avatarStyle} />
        </Link>
        <div style={CommonStyles.bubbleManage.usernameStyle}>
          <Link to={userNode.username}>{userNode.first_name}
            {userNode.user_role_in_bubble === 'owner' ? ' (Admin)' : ''}
          </Link>
        </div>
        <div style={CommonStyles.bubbleManage.userTitleStyle}>
          {userNode.zip_code},&nbsp;{moment().diff(userNode.birthday, 'years')} years old
        </div>
        <div style={CommonStyles.bubbleManage.menuContainerStyle}>
          {menu}
        </div>
      </div>
    );
  }

  members = (bubble) => {
    const users = bubble.members.edges;
    const usersCount = users.length;
    return users.map((user, i) => {
      return this.userItem(
        i,
        user.node,
        i >= usersCount - 1,
        <IconMenu
          iconButtonElement={
            <IconButton touch iconStyle={{ color: CommonStyles.iconColor }} style={CommonStyles.bubbleManage.iconButtonStyle}>
              <IconMoreVert />
            </IconButton>
          }
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          targetOrigin={{ horizontal: 'right', vertical: 'top' }}
          menuStyle={{ width: 120 }} >
          <MenuItem
            style={CommonStyles.bubbleManage.menuItemStyle}
            primaryText='Remove'
            onTouchTap={this.removeMember.bind(this, user.node.id)}
            disabled={user.node.user_role_in_bubble === 'owner'} />
          <MenuItem
            style={CommonStyles.bubbleManage.menuItemStyle}
            primaryText='Ban'
            onTouchTap={this.banMember.bind(this, user.node.id)}
            disabled={user.node.user_role_in_bubble === 'owner'} />
          {/* <MenuItem
            style={CommonStyles.bubbleManage.menuItemStyle}
            primaryText='Block'
            disabled />*/}
          <MenuItem
            style={CommonStyles.bubbleManage.menuItemStyle}
            primaryText='Make admin'
            onTouchTap={this.makeAdmin.bind(this, user.node.id)}
            disabled={user.node.user_role_in_bubble !== 'guest'} />
        </IconMenu>
      );
    });
  }

  bannedUsers = (bubble) => {
    const { banned_users } = bubble;
    if (!banned_users || !banned_users.edges || !banned_users.edges.length) {
      return undefined;
    }
    const users = banned_users.edges;
    const usersCount = users.length;
    const titleStyle = {
      margin: '25px 0',
      fontWeight: 700,
      color: 'inherit',
    };
    return (
      <div>
        <h3 style={titleStyle}>Banned Users:</h3>
        {
          users.map((user, i) => {
            return this.userItem(
              i,
              user.node,
              i >= usersCount - 1,
              <IconMenu
                iconButtonElement={
                  <IconButton touch iconStyle={{ color: CommonStyles.iconColor }} style={CommonStyles.bubbleManage.iconButtonStyle}>
                    <IconMoreVert />
                  </IconButton>
                }
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                menuStyle={{ width: 120 }} >
                <MenuItem
                  style={CommonStyles.bubbleManage.menuItemStyle}
                  primaryText='Unban'
                  onTouchTap={this.unbanMember.bind(this, user.node.id)} />
              </IconMenu>
            );
          })
        }
      </div>
    );
  }

  render() {
    const { loading, bubble } = this.props.data;
    if (!bubble) {
      return (
        <div>Loading bubble users...</div>
      );
    }

    return (
      <div style={CommonStyles.bubbleManage.containerStyle}>
        <div style={CommonStyles.bubbleManage.topbarStyle}>
          <BubbleManageTopBar openDeleteDialog={this.props.openDeleteDialog} permalink={this.props.bubble.permalink} currentUrl='bubble-manage-users' />
        </div>
        {this.members(bubble)}
        {this.bannedUsers(bubble)}
      </div>
    );
  }
}

export default hoc(BubbleManageUsers);
