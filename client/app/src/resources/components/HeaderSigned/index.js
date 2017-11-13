/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import cookie from 'react-cookie';
import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import MenuItem from 'material-ui/MenuItem';
import IconSocialNotificationsActive from 'material-ui/svg-icons/social/notifications-active';
import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconUser from 'material-ui/svg-icons/social/person-outline';
import IconSettings from 'material-ui/svg-icons/action/settings';
import IconHelp from 'material-ui/svg-icons/action/help-outline';
import IconExit from 'material-ui/svg-icons/action/exit-to-app';
import { List, ListItem } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import Dialog from 'material-ui/Dialog';
import Popover from 'material-ui/Popover';
import Badge from 'material-ui/Badge';
import RaisedButton from 'material-ui/RaisedButton';
import gql from 'graphql-tag';
import Search from '@common/Search';
import NotificationItem from '@common/NotificationItem';
import GalleryItem from '@common/GalleryItem';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class HeaderSigned extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      anchorElNotif: {},
      anchorElUser: {},
      anchorElFriends: {},
      value: 3,
      avatar: '',
      clearNotifs: false,
      clearFriendsNotifs: false,
      openNotifs: false,
      notifications: null,
      friendNotifications: null,
      open: false,
      openUserMenu: false,
      openFriendsNotifs: false,
      mediaId: null,
      openShowMedia: false,
    };
  }

  componentWillMount = () => {
    this.listenPusher();
  }

  componentDidMount = () => {
    this.onMount();
  }

  componentWillUnmount = () => {
    this.unlistenPusher();
  }

  onMount = () => {
    this.setState({
      anchorElNotif: ReactDOM.findDOMNode(ReactDOM.findDOMNode(this.refs.notifs)),
      anchorElUser: ReactDOM.findDOMNode(this.refs.usermenu),
      anchorElFriends: ReactDOM.findDOMNode(this.refs.friendnotifs),
    });
  }

  listenPusher = () => {
    const channel = this.context.userChannel;
    if (!channel) { return; }
    channel.bind('notification_added', this.handleNotificationAdded);
    channel.bind('avatar_changed', this.handleAvatarChanged);
  }

  unlistenPusher = () => {
    const channel = this.context.userChannel;
    channel.unbind('notification_added', this.handleNotificationAdded);
    channel.unbind('avatar_changed', this.handleAvatarChanged);
  }

  handleNotificationAdded = (data) => {
    if ($('.top-notifs').length === 0) {
      const stateUpdate = {
        notifications: null,
        friendNotifications: null,
      };
      if (data.notification.name.substr(0, 11).toLowerCase() === 'friendships') {
        stateUpdate.clearFriendsNotifs = false;
      }
      else {
        stateUpdate.clearNotifs = false;
      }
      this.setState(stateUpdate);
      this.props.data.refetch();
      this.notifSound();
    }
  }

  handleAvatarChanged = (data) => {
    this.setState({
      avatar: data.user_data.thumb_avatar_url,
    });
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

  notifSound = () => {
    const soundElements = [
      '/assets/afk.mp3',
    ];
    const music = new Audio(soundElements[0]);
    music.load();
    music.play();
  }

  signOut = () => {
    const self = this;
    this.setState({
      notifications: null,
      friendNotifications: null,
    });

    this.props.client.mutate({
      mutation: gql`
        mutation signOutCurrentUser {
          signOutUser(input: {}) {
            user {
              id
            }
          }
        }
      `,
      variables: {
      },
    })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        notify.show(errors[0].message, 'error');
      } else {
        const activeCacheObject = {
          myBubblz: false,
          myFeed: false,
          friendsFeed: false,
          intPeople: false,
          intBubblz: false,
          privChat: false,
          notifs: false,
        };
        localStorage.setItem('mbubblz_activeCache', JSON.stringify(activeCacheObject));
        localStorage.setItem('mbubblz_user', '');
        localStorage.setItem('mbubblz_token', '');
        localStorage.setItem('mbubblz_client_id', '');

        self.props.router.push('/signin');
        if (this.props.onSignout) {
          this.props.onSignout();
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.props.router.push('/signin');
    });
  }

  updateNotifications = (index, type) => {
    const notificationsInit = this.state.notifications ? this.state.notifications : this.props.data.myNotifications.edges;
    const notifications = JSON.parse(JSON.stringify(notificationsInit));

    if (type === 'mark_as_read') {
      notifications[index].node.unread = false;
      this.setState({ notifications });
    }
  }

  refetchNotifs = () => {
    this.setState({
      notifications: null,
      friendNotifications: null,
    });
    this.props.data.refetch();
  }

  clearCounter = (event) => {
    event.preventDefault();
    this.props.client.mutate({
      mutation: gql`
        mutation clearMissedNotifs {
          touchAllNotifications(input: {}) {
            status
          }
        }
      `,
    }).then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        // self.refetchNotifs()
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });

    this.setState({
      clearNotifs: true,
      openNotifs: true,
      openFriendsNotifs: false,
      openUserMenu: false,
    });
  }

  clearFriendsCounter = (event) => {
    event.preventDefault();
    this.props.client.mutate({
      mutation: gql`
        mutation clearMissedActionNotifs {
          touchAllActionNotifications(input: {}) {
            status
          }
        }
      `,
    }).then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        // self.refetchNotifs()
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });

    this.setState({
      clearFriendsNotifs: true,
      openFriendsNotifs: true,
      openNotifs: false,
      openUserMenu: false,
    });
  }

  closeMenu = () => {
    this.setState({
      openNotifs: false,
    });
  }

  handleClickShowUpdates = () => {
    cookie.save('updateBannerClosed', true, { path: '/' });
    this.props.onCloseTopBanner();
  }

  handleRequestCloseNotifs = (reason) => {
    this.setState({
      openNotifs: false,
    });
  };

  handleRequestCloseFriendsNotifs = () => {
    this.setState({
      openFriendsNotifs: false,
    });
  };

  handleRequestCloseUserMenu = () => {
    this.setState({
      openUserMenu: false,
    });
  };

  render() {
    if (this.props.data.errors) {
      if (this.props.data.errors.graphQLErrors && this.props.data.errors.graphQLErrors[0].message === 'User is unauthorized') {
        return;
      }
    }

    const iconColor = '#cfcfcf';

    const iconButtonStyle = {
      verticalAlign: 'middle',
      padding: '0',
      marginBottom: '-1px',
      width: '38px',
      height: '50px',
      lineHeight: 1,
      cursor: 'pointer',
    };

    const iconStyle = {
      width: '20px',
      height: '20px',
    };

    const dividerStyle = {
      backgroundColor: '#f5f5f5',
    };

    const subheaderStyles = {
      fontSize: 13,
      borderBottom: '1px solid #f1f1f1',
      lineHeight: '42px',
      marginTop: '-8px',
    };

    const avatar_url = this.state.avatar ? this.state.avatar : JSON.parse(localStorage.getItem('mbubblz_user')).avatar_url;

    let notifications = (<List className='top-notifs header-notifications' style={{ padding: 0 }}>
      <Subheader style={subheaderStyles}>Latest notifications</Subheader>
      <ListItem style={{ fontSize: 13 }} className='notifications-empty-item' primaryText='Loading...' />
    </List>);
    let missedNotifs = '';

    let friendsNotifs = <List className='top-notifs header-notifications' style={{ padding: 0 }}>
      <Subheader style={subheaderStyles}>Latest notifications</Subheader>
      <ListItem style={{ fontSize: 13 }} className='notifications-empty-item' primaryText='Loading...' />
    </List>;
    let missedFriendsNotifs = '';

    if (!this.props.data.loading && !this.props.data.errors) {
      /* normal notifications */
      const notif_array = this.state.notifications ? this.state.notifications : this.props.data.myNotifications.edges;
      missedNotifs = this.state.clearNotifs ? '' : (this.props.data.myNotifications.unread_notifications_count || '');
      if (notif_array.length < 1) {
        notifications = <List className='top-notifs header-notifications no-notifs' style={{ padding: 0 }}>
          <Subheader style={subheaderStyles}>Latest notifications</Subheader>
          <ListItem style={{ fontSize: 13 }} className='notifications-empty-item' primaryText='You have no new notifications' />
        </List>;
      }
      else {
        notifications = (<List className='top-notifs header-notifications' style={{ padding: 0 }}>
          <Subheader style={subheaderStyles}>Latest notifications</Subheader>
          { !notif_array.length ?
            <ListItem
              style={{ fontSize: 13 }}
              className='notifications-empty-item'
              primaryText='You have no new notifications'
            />
          :
            <div className='notif-wrapper'>
              {
                notif_array.map((notif, index) => (
                  <div key={index}>
                    <NotificationItem
                      index={index}
                      notif={notif.node}
                      updateNotifications={this.updateNotifications}
                      closeMenu={this.closeMenu}
                      refetchNotifs={this.refetchNotifs}
                      handleMediaDialogOpen={this.handleMediaDialogOpen}
                    />
                    {index < notif_array.length - 1 ? <Divider style={dividerStyle} inset={false} /> : null}
                  </div>
                ))
              }
            </div>
          }
          <Link to='/notifications' className='view-all-link'>
            <RaisedButton
              className='view-all-notifs'
              backgroundColor='#FFFFFF'
              label='View all'
              labelStyle={{ textTransform: 'capitalize', fontSize: 13, color: '#68C39F' }}
              fullWidth
              style={{
                borderRadius: 0,
              }}
            />
          </Link>
        </List>);
      }

      /* friend notifications */
      const friendNotifArray = this.state.friendNotifications ? this.state.friendNotifications : this.props.data.myActionNotifications.edges;
      missedFriendsNotifs = this.state.clearFriendsNotifs ? '' : (this.props.data.myActionNotifications.unread_notifications_count || '');
      if (friendNotifArray.length < 1) {
        friendsNotifs = <List className='top-notifs header-notifications no-notifs' style={{ padding: 0 }}>
          <Subheader style={subheaderStyles}>Latest notifications</Subheader>
          <ListItem style={{ fontSize: 13 }} className='notifications-empty-item' primaryText='You have no new notifications' />
        </List>;
      }
      else {
        friendsNotifs = (<List className='top-notifs header-notifications' style={{ padding: 0 }}>
          <Subheader style={subheaderStyles}>Friend notifications</Subheader>
          <div className='notif-wrapper'>
            {
              friendNotifArray.map((notif, index) => (
                <div key={index}>
                  <NotificationItem
                    index={index}
                    notif={notif.node}
                    updateNotifications={this.updateNotifications}
                    closeMenu={this.closeMenu}
                    refetchNotifs={this.refetchNotifs}
                    handleMediaDialogOpen={this.handleMediaDialogOpen}
                  />
                  {index < friendNotifArray.length - 1 ? <Divider style={dividerStyle} inset={false} /> : null}
                </div>
              ))
            }
          </div>
          <Link to='/friendnotifications' className='view-all-link'>
            <RaisedButton
              className='view-all-notifs'
              backgroundColor='#FFFFFF'
              label='View all'
              labelStyle={{ textTransform: 'capitalize', fontSize: 13, color: '#68C39F' }}
              fullWidth
              style={{
                borderRadius: 0,
              }}
            />
          </Link>
        </List>);
      }
    }

    const menuItemStyle = {
      fontSize: 13,
      lineHeight: '30px',
      padding: '4px 0',
      minHeight: '30px',
    };

    return (
      <div className='app-menubar' style={{ position: 'fixed', width: '100%', height: 56, backgroundColor: '#3C455C', color: '#FFFFFF' }}>
        <div className='app-menubar-container'>
            {/* Left part */}
            <div className={this.props.location.pathname.indexOf('help') > -1 ? 'app-menu-expand help-page-logo' : 'app-menu-expand'}>
              {/* <Link to='/' className='app-menubar-item app-logo'>
                <span className='app-logo-wrapper'>
                  <span className='app-logo-text'>z</span>
                </span>
              </Link>*/}
              <Link to='/' className='app-menubar-item app-logo'>
                <img src='/assets/home-logo.png' role='presentation' />
              </Link>
            </div>
            {/* Center part */}
            <div className='app-search-wrapper'>
              <div className='app-search'>
                { !this.props.hideSearch ?
                  <Search
                    __need_for_updating={this.props.__need_for_updating}
                    changeSearchKeyword={this.props.changeSearchKeyword}
                    searchKeyword={this.props.searchKeyword}
                    router={this.props.router} />
                  :
                  ''
                }
              </div>
            </div>
            {/* Right part */}
            <div className='app-user mui--text-right'>
              <IconButton
                ref="notifs"
                className='button-bordered-hover'
                style={iconButtonStyle}
                iconStyle={{ height: 20, width: 20, padding: 0 }}
                onTouchTap={this.clearCounter}
              >
                <Badge
                  badgeContent={missedNotifs}
                  badgeStyle={{
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    fontSize: 9,
                    fontWeight: 400,
                    backgroundColor: (missedNotifs ? '#D97575' : 'transparent'),
                    color: '#FFFFFF',
                  }}
                  style={{ padding: 0 }}
                >
                  <IconSocialNotificationsActive color={iconColor} style={{ width: 22, height: 22 }}/>
                </Badge>
              </IconButton>
              <Popover
                className={`notif-menu ${this.state.openNotifs ? 'open' : ''}`}
                open={this.state.openNotifs}
                canAutoPosition={false}
                useLayerForClickAway={false}
                anchorEl={this.state.anchorElNotif}
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                targetOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                onRequestClose={this.handleRequestCloseNotifs}
                style={{
                  width: $(window).width() > 480 ? 360 : '100%',
                  paddingTop: 8,
                  marginTop: 50,
                }}
              >
                { notifications }
              </Popover>

              <IconButton
                ref="friendnotifs"
                className='button-bordered-hover'
                style={iconButtonStyle}
                iconStyle={{ height: 20, width: 20, padding: 0 }}
                onTouchTap={this.clearFriendsCounter}
              >
                <Badge
                  badgeContent={missedFriendsNotifs}
                  badgeStyle={{
                    top: -6,
                    right: -4,
                    width: 16,
                    height: 16,
                    fontSize: 9,
                    fontWeight: 400,
                    backgroundColor: (missedFriendsNotifs ? '#D97575' : 'transparent'),
                    color: '#FFFFFF',
                  }}
                  style={{ padding: 0 }}
                >
                  <IconSocialPeople color={iconColor} style={iconStyle} />
                </Badge>
              </IconButton>

              <Popover
                className={`friends-menu ${this.state.openFriendsNotifs ? 'open' : ''}`}
                open={this.state.openFriendsNotifs}
                canAutoPosition={false}
                useLayerForClickAway={false}
                anchorEl={this.state.anchorElFriends}
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                targetOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                onRequestClose={this.handleRequestCloseFriendsNotifs}
                style={{
                  width: $(window).width() > 480 ? 360 : '100%',
                  paddingTop: 8,
                  marginTop: 50,
                }}
              >
                { friendsNotifs }
              </Popover>

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

              <Link to='/'>
                <Avatar
                  src={avatar_url}
                  size={26}
                  style={{
                    borderRadius: '50%',
                    marginLeft: '10px',
                    marginTop: '-2px',
                  }}
                />
              </Link>

              <IconButton
                ref='usermenu'
                className='user-menu-icon'
                style={iconButtonStyle}
                iconStyle={iconStyle}
                onTouchTap={
                  (event) => {
                    event.preventDefault();
                    this.setState({
                      openUserMenu: true,
                      openNotifs: false,
                      openFriendsNotifs: false,
                    })
                  }
                }
              >
                <NavigationExpandMoreIcon color={iconColor}/>
              </IconButton>
              <Popover
                className={`user-menu ${this.state.openUserMenu ? 'open' : ''}`}
                open={this.state.openUserMenu}
                canAutoPosition={false}
                useLayerForClickAway={false}
                anchorEl={this.state.anchorElUser}
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                targetOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                onRequestClose={this.handleRequestCloseUserMenu}
                style={{
                  width: $(window).width() > 480 ? 180 : '100%',
                  padding: '8px 0',
                  marginTop: 50,
                }}
              >
                <MenuItem
                  className='user-menu-item'
                  primaryText='My Profile'
                  leftIcon={<IconUser style={{ margin: '2px 0 2px 12px' }} />}
                  onClick={() => this.props.router.push('/')}
                  style={menuItemStyle}
                />
                <MenuItem
                  className='user-menu-item'
                  primaryText='Settings'
                  leftIcon={<IconSettings style={{ margin: '2px 0 2px 12px' }} />}
                  onClick={() => this.props.router.push('/settings')}
                  style={menuItemStyle}
                />
                <MenuItem
                  className='user-menu-item'
                  primaryText='Help & Feedback'
                  leftIcon={<IconHelp style={{ margin: '2px 0 2px 12px' }} />}
                  onClick={() => this.props.router.push('/help')}
                  style={menuItemStyle}
                />
                <Divider style={{ margin: '7px 15px 8px' }} />
                <MenuItem
                  className='user-menu-item'
                  primaryText='Sign out'
                  leftIcon={<IconExit style={{ margin: '2px 0 2px 12px' }} />}
                  onClick={this.signOut}
                  style={menuItemStyle}
                />
              </Popover>
            </div>
          </div>
      </div>
    );
  }
}

HeaderSigned.propTypes = {
  mutate: React.PropTypes.func,
  data: React.PropTypes.object,
  query: React.PropTypes.func,
};

export default withApollo(hoc(HeaderSigned));
