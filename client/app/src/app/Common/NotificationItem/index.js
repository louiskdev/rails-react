/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import moment from 'moment';
import { Link } from 'react-router';
import Avatar from 'material-ui/Avatar';
import IconAddUser from 'material-ui/svg-icons/navigation/check';
import IconRemoveUser from 'material-ui/svg-icons/content/clear';
import IconClose from 'material-ui/svg-icons/navigation/close';

import { ListItem } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';

import ReactGA from 'react-ga';

import hoc from './hoc';

class NotificationItem extends Component {

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  onClickNotification = (notification, index, notifType, unread) => {
    const self = this;
    if (notifType === 'stop_page') {
      setTimeout(() => self.props.router.push(notification), 500);
      return;
    }

    if (notification.medium_id) {
      this.props.handleMediaDialogOpen(notification.medium_id);
      return;
    }

    let pageUrl = '';
    if (!notification.comment_id && notification.bubble) {
      pageUrl = `/bubbles/${notification.bubble.permalink}`;
    }

    if (notification.activity_id) {
      pageUrl = notification.comment_id ?
          `/page/${notification.activity_id}?comment_id=${notification.comment_id}`
        :
          `/page/${notification.activity_id}`;
    }

    if (unread) {
      self.props.readNotification({ variables: { id: parseInt(notification.id) } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          if (errors.length > 0) {
            notify.show(errors[0].message, 'error');
          }
        }
        else {
          self.props.updateNotifications(index, 'mark_as_read');

          if (notifType !== '') {
            if (self.props.closeMenu) {self.props.closeMenu();}
            setTimeout(() => self.props.router.push(pageUrl), 500);
          }
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
    else if (notifType !== '') {
      if (this.props.closeMenu) { this.props.closeMenu(); }
      setTimeout(() => self.props.router.push(pageUrl), 500);
    }
  }

  destroyNotification = (notificationId) => {
    const self = this;
    self.props.destroyNotification({ variables: { id: parseInt(notificationId) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error');
        }
      }
      else {
        setTimeout(() => self.props.refetchNotifs(), 500);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.props.refetchNotifs();
    });
  }

  acceptFriendship = (notification, index) => {
    const self = this;
    self.props.acceptFriendship({ variables: { id: parseInt(notification.id), friend_id: parseInt(notification.initiator.id) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error');
        }
      }
      else {
        ReactGA.event({
          category: 'User',
          action: 'Accepted a friendship request',
        });
        setTimeout(() => self.props.refetchNotifs(), 1500);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.props.refetchNotifs();
    });
  }

  declineFriendship = (notification, index) => {
    const self = this;
    self.props.declineFriendship({ variables: { id: parseInt(notification.id), friend_id: parseInt(notification.initiator.id) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error');
        }
      }
      else {
        ReactGA.event({
          category: 'User',
          action: 'Declined a friendship request',
        });
        setTimeout(() => self.props.refetchNotifs(), 1500);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.props.refetchNotifs();
    });
  }

  acceptInvitation = (notification, index) => {
    const self = this;
    const token = notification.new_member_token;
    self.props.acceptInvitation({ variables: { token: token } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error');
        }
      }
      else {
        ReactGA.event({
          category: 'Bubble',
          action: 'Accepted an invitation to bubble',
        });
        setTimeout(() => self.props.refetchNotifs(), 1000);
        setTimeout(() => self.props.router.push(`/bubbles/${notification.bubble.permalink}`), 1500);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.props.refetchNotifs();
    });
  }

  declineInvitation = (notification, inde) => {
    const self = this;
    const token = notification.new_member_token;
    self.props.declineInvitation({ variables: { token: token } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error');
        }
      }
      else {
        ReactGA.event({
          category: 'Bubble',
          action: 'Declined an invitation to bubble',
        });
        setTimeout(() => self.props.refetchNotifs(), 1000);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.props.refetchNotifs();
    });
  }

  render() {
    const styleWrapper = {
      padding: '14px 10px 10px 66px',
    };

    const styleAcceptButton = {
      backgroundColor: '#5ed28f',
      minWidth: 'auto',
      color: '#fff',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      position: 'absolute',
      top: '24px',
      right: '40px',
    };

    const styleDeclineButton = {
      backgroundColor: '#d97575',
      color: '#fff',
      minWidth: 'auto',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      position: 'absolute',
      top: '24px',
      right: '10px',
    };

    const iconActionsStyle = {
      color: '#FFFFFF',
      margin: '2px',
      width: '20px',
      height: '20px',
    };

    const notif = this.props.notif;

    let actionButtons = '';
    let type = '';
    let message = notif.text;
    let classNameText = notif.unread ? 'notifications-event-item unread' : 'notifications-event-item';

    if (notif.text === 'wants to add you as a friend') {
      actionButtons = (<div className='action-buttons'>
        <FlatButton
          style={styleAcceptButton}
          hoverColor='#52b97e'
          primary
          onClick={() => this.acceptFriendship(notif, this.props.index)}
        >
          <IconAddUser style={iconActionsStyle} />
        </FlatButton>
        <FlatButton
          style={styleDeclineButton}
          hoverColor='#52b97e'
          secondary
          onClick={() => this.declineFriendship(notif, this.props.index)}
        >
          <IconRemoveUser style={iconActionsStyle} />
        </FlatButton>
      </div>);
      classNameText = notif.unread ? 'notifications-friend-item unread' : 'notifications-friend-item';

    }
    else if (notif.text === 'was added to your Friends list' || notif.text === 'was removed from your Friends list') {
    }
    else if (notif.text === 'accepted your invitation to join bubble' || notif.text === 'declined your invitation to join bubble') {
    }
    else if (notif.text === 'You were invited to join the bubble') {
      actionButtons = (<div className='action-buttons'>
        <FlatButton
          style={styleAcceptButton}
          hoverColor='#52b97e'
          primary
          onClick={() => this.acceptInvitation(notif, this.props.index)}
        >
          <IconAddUser style={iconActionsStyle} />
        </FlatButton>
        <FlatButton
          style={styleDeclineButton}
          hoverColor='#52b97e'
          secondary
          onClick={() => this.declineInvitation(notif, this.props.index)}
        >
          <IconRemoveUser style={iconActionsStyle} />
        </FlatButton>
      </div>);
      const type_bubble_msg = notif.bubble.type === 'privy' ? 'the private bubble' : 'the public bubble';
      message = (<span>
        {notif.text.replace('the bubble', type_bubble_msg)}&nbsp;
        <Link to={`/bubbles/${notif.bubble.permalink}`}>
          {notif.bubble.name}
        </Link>
      </span>);
    }

    if (
        notif.text.indexOf('left your bubble') > -1 ||
        notif.text.indexOf('accepted your invitation to join bubble') > -1 ||
        notif.text.indexOf('declined your invitation to join bubble') > -1 ||
        notif.text.indexOf('banned') > -1
    ) {
      if (notif.bubble) {
        message = (<span>
          {notif.text}&nbsp;
          <Link
            className='bubble-link'
            onClick={() => this.onClickNotification(`/bubbles/${notif.bubble.permalink}`, this.props.index, 'stop_page', notif.unread)}
            to={`/bubbles/${notif.bubble.permalink}`}
          >
            {notif.bubble.name}
          </Link>
        </span>);
      }
      else {
        message = (<span>
          {notif.text}
        </span>);
      }
    }

    if (notif.text.indexOf('mentioned') > -1) {
      type = 'page_link';
      if (notif.bubble) {
        message = (<span>
          {notif.text} in bubble&nbsp;
          <Link
            className='bubble-link'
            onClick={() => this.onClickNotification(`/bubbles/${notif.bubble.permalink}`, this.props.index, 'stop_page', notif.unread)}
            to={`/bubbles/${notif.bubble.permalink}`}
          >
            {notif.bubble.name}
          </Link>
        </span>);
      }
      else {
        let mentionedPlace = '';
        if (notif.object_type == 'Comment') {
          mentionedPlace = 'in a comment';
        }
        else if (notif.object_type == 'Note') {
          mentionedPlace = 'in a feed';
        }
        else {
          mentionedPlace = 'in chat';
        }
        message = (<span>
          {notif.text} {mentionedPlace}
        </span>);
      }
    }

    if (notif.text.indexOf('liked your post') > -1 ||
        notif.text.indexOf('commented your post') > -1 ||
        notif.text.indexOf('rated your post') > -1 ||
        notif.text.indexOf('liked a note on your feed') > -1 ||
        notif.text.indexOf('commented a note on your feed') > -1 ||
        notif.text.indexOf('rated a note on your feed') > -1 ||
        notif.text.indexOf('replied to your comment') > -1 ||
        notif.text.indexOf('liked your comment') > -1
      ) {
      type = 'page_link';
      if (notif.bubble) {
        message = (<span>
          {notif.text} in&nbsp;
          <Link
            className='bubble-link'
            onClick={() => this.onClickNotification(`/bubbles/${notif.bubble.permalink}`, this.props.index, 'stop_page', notif.unread)}
            to={`/bubbles/${notif.bubble.permalink}`}
          >
            {notif.bubble.name}
          </Link>
          &nbsp;bubble.
        </span>);
      }
    }

    if (notif.event) {
      message = (<span>
        <Link to={`/u/${notif.initiator.username}`}>{notif.initiator.username}</Link>&nbsp;
        {notif.text}&nbsp;
        <Link to='/events'>{notif.event.name}</Link>
      </span>);
    }

    if (notif.text.indexOf('Your Video / Image was commented') > -1) {
      if (notif.bubble) {
        message = (<span>
          {notif.text} in&nbsp;
          <Link
            className='bubble-link'
            onClick={() => this.onClickNotification(`/bubbles/${notif.bubble.permalink}/gallery`, this.props.index, 'stop_page', notif.unread)}
            to={`/bubbles/${notif.bubble.permalink}/gallery`}
          >
            {notif.bubble.name}
          </Link>
          &nbsp;bubble.
        </span>);
      } else {
        type = 'page_link';
      }
    }

    const dateString = moment.utc(notif.created_at.replace(' UTC', '')).toDate();
    const title = (<div>
      <div className='title'>
        <span className='username'>
          {notif.initiator ?
            <Link
              onClick={() => this.onClickNotification(`/u/${notif.initiator.username}`, this.props.index, 'stop_page', notif.unread)}
              to={`/u/${notif.initiator.username}`}
            >
              @{notif.initiator.username}
            </Link>
          :
            null
          }
        </span>
        <span className='message'>{message}</span>
        <div className='time'>{moment(dateString).fromNow().replace('a few seconds ago', 'just now').replace('a day ago', 'yesterday')}</div>
      </div>
    </div>);

    return (
      <ListItem
        leftAvatar={notif.initiator ? <Avatar src={notif.initiator.avatar_url} /> : null}
        rightIconButton={<span>
            <span className='remove-notif' style={{ cursor: 'pointer' }} onTouchTap={() => this.destroyNotification(notif.id)}>
              <IconClose color='#e4e4e4' style={{ width: 18, height: 18 }}/>
            </span>
            {actionButtons}
          </span>
        }
        primaryText={title}
        className={classNameText}
        innerDivStyle={styleWrapper}
        onTouchTap={() => this.onClickNotification(notif, this.props.index, type, notif.unread)}
      />
    );
  }
}

export default hoc(NotificationItem);
