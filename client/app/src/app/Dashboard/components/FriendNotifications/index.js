/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import { List, ListItem } from 'material-ui/List';
import Divider from 'material-ui/Divider';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import IconSocialNotificationsActive from 'material-ui/svg-icons/social/notifications-active';
import IconSocialPeople from 'material-ui/svg-icons/social/people';

import NotificationItem from '@common/NotificationItem';
import GalleryItem from '@common/GalleryItem';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

class FriendNotifications extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      currentUserId: null,
      value: 3,
      mediaId: null,
      openShowMedia: false,
    };
  }

  componentWillMount = () => {
    this.listenPusher();
  }

  componentWillUnmount = () => {
    this.unlistenPusher();
  }

  listenPusher = () => {
    const self = this;
    const channel = this.context.userChannel;
    channel.bind('notification_added', (data) => {
      const notifications = this.state.notifications ? this.state.notifications : this.props.data.myActionNotifications.edges;
      self.props.data.refetch({ first: notifications.length + 1 });
    });
  }

  updateNotifications = (index, type) => {
    const notifications = this.state.notifications ? this.state.notifications : this.props.data.myActionNotifications.edges;
    if (type === 'mark_as_read') {
      notifications[index].node.unread = false;
      this.setState({ notifications });
    }
  }

  updateNotificationsArray = (notifications) => {
    this.setState({ notifications });
  }

  refetchNotifs = () => {
    const notifications = this.state.notifications ? this.state.notifications : this.props.data.myActionNotifications.edges;
    this.props.data.refetch({ first: notifications.length + 1 });
  }

  unlistenPusher = () => {
    const channel = this.context.userChannel;
    channel.unbind('notification_added');
  }

  handleMediaDialogOpen = (mediaId) => {
    this.setState({ mediaId });
    this.setState({ openShowMedia: true });
  }

  handleMediaDialogClose = () => {
    this.setState({
      mediaId: null,
      openShowMedia: false,
    });
  }

  loadMoreNotifications = () => {
    let notifications = this.state.notifications ? this.state.notifications : this.props.data.myActionNotifications.edges;
    const lastCursor = notifications.length > 0 ? notifications[notifications.length - 1].cursor : '';
    this.props.client.query({
      query: gql`
        query getMyNotifs($lastCursor: String!) {
          myActionNotifications(first: 10, after: $lastCursor) {
            edges {
              cursor
              node {
                code
                created_at
                id
                activity_id
                bubble {
                  id
                  name
                  permalink
                }
                initiator {
                  id
                  username
                  avatar_url(version: "micro")
                }
                event {
                  id
                  name
                }
                text
                unread
                new_member_token
              }
            }
          }
        }
      `,
      variables: {
        lastCursor: lastCursor,
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
        // Update notifications
        if (data.myActionNotifications && data.myActionNotifications.edges.length > 0) {
          notifications = notifications.concat(data.myActionNotifications.edges);
        }
      }
      this.updateNotificationsArray(notifications);
    }).catch((error) => {
      this.updateNotificationsArray(notifications);
      notify.show(error.message, 'error', 2000);
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
    if (!this.props.data.myActionNotifications) {
      return (
        <div>
          Notifications loading ...
        </div>
      );
    }
    else {
      let notifications = 'Loading...';
      const notifsArray = this.state.notifications ? this.state.notifications : this.props.data.myActionNotifications.edges;

      if (notifsArray.length < 1) {
        notifications = 'You have no notifications';
      }
      else {
        notifications = (
          <List
            className='header-notifications'
            innerDivStyle={{ padding: 0 }}
            style={{ paddingTop: 0, paddingBottom: 0 }}
          >
            {!notifsArray.length ?
              <ListItem
                style={{ fontSize: 13 }}
                className='notifications-empty-item'
                primaryText='You have no new notifications'
              />
            :
              notifsArray.map((notif, index) => (
                <div key={index}>
                  <NotificationItem
                    index={index}
                    notif={notif.node}
                    updateNotifications={this.updateNotifications}
                    refetchNotifs={this.refetchNotifs}
                    handleMediaDialogOpen={this.handleMediaDialogOpen}
                  />
                  { index < notifsArray.length - 1 ?
                    <Divider style={CommonStyles.dividerStyle} inset={false} />
                  :
                    null
                  }
                </div>)
              )
            }
            {notifsArray.length % 10 === 0 ?
              <RaisedButton
                className='view-all-notifs'
                label='Load more'
                labelStyle={{ textTransform: 'capitalize' }}
                fullWidth
                style={{ marginTop: 2 }}
                onClick={this.loadMoreNotifications}
              />
            :
              null
            }
          </List>);
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
        <div className='myb-messages-box'>
          <div className='topbar'>
            <Link to='/messages'>
              <FlatButton
                className='myb-small-button'
                backgroundColor={topBtnBgColorInactive}
                hoverColor={topBtnBgColorInactive}
                style={{ ...topBtnStyle, color: topBtnColorInactive }}
              >
                Chat
              </FlatButton>
            </Link>
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
            <FlatButton
              className='myb-small-button'
              backgroundColor={topBtnBgColor}
              hoverColor={topBtnBgColor}
              style={{ ...topBtnStyle, border: 'none', borderBottom: topBtnBorder, padding: $(window).width() < 768 ? '10px 24px' : '12px 24px' }}
            >
            { $(window).width() < 768 ? <IconSocialPeople color='#fff' style={{ verticalAlign: '-30%', width: 20 }}/> : 'Friend Notifications'}
            </FlatButton>
          </div>
          <div className='notifications-wrapper'>
            <Dialog
              className='gallery-media-preview'
              modal={false}
              open={this.state.openShowMedia}
              onRequestClose={this.handleMediaDialogClose}
              autoDetectWindowHeight
              autoScrollBodyContent={false}
              contentStyle={CommonStyles.dialog.gallery_content}
              bodyStyle={CommonStyles.dialog.body}
              style={CommonStyles.dialog.root}
              repositionOnUpdate={false}
            >
              <GalleryItem media_id={this.state.mediaId} />
            </Dialog>
            { notifications }
          </div>
        </div>
      );
    }
  }
}

FriendNotifications.propTypes = {
  data: React.PropTypes.object,
  query: React.PropTypes.func,
};

export default withApollo(hoc(FriendNotifications));
