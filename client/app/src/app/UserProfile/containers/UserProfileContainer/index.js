/* @flow */

import React, { Component } from 'react';
import $ from 'jquery';
import { Link } from 'react-router';
import { notify } from 'react-notify-toast';
import FlatButton from 'material-ui/FlatButton';
import Sidebar from 'react-sidebar';
import gql from 'graphql-tag';
import IconHome from 'material-ui/svg-icons/action/home';
import IconMenu from 'material-ui/svg-icons/navigation/menu';
import IconActionAssignment from 'material-ui/svg-icons/action/assignment';
import IconImagePhotoCamera from 'material-ui/svg-icons/image/photo-camera';
import IconBubbles from 'material-ui/svg-icons/action/donut-small';
import IconZoom from 'material-ui/svg-icons/action/zoom-in';
import IconVideoPlay from 'material-ui/svg-icons/av/play-circle-filled';

import ReactGA from 'react-ga';

import Interests from '@common/Interests';
import UserFeed from '@userprofile/components/UserFeed';
import NonFriendsNotAllowed from '@userprofile/components/NonFriendsNotAllowed';
import UserBubblz from '@userprofile/components/UserBubblz';
import UserGallery from '@userprofile/components/UserGallery';
import UserGalleryAlbum from '@userprofile/components/UserGalleryAlbum';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class UserProfileContainer extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
    chatFunctions: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      keyword: '',
      loadingState: false,
      allBubbles: false,
      mediaId: null,
      openShowMedia: false,
      userCover: '#ffffff',
      sidebarOpen: false,
      sidebarDocked: false,
      shortSidebarStyle: true,
      mql: null,
      friendStatus: 0,  // 0: not acquired (must ignore), 1: friend, 2: not friend
      friendRequestPending: false,
      username: '',
    };
  }

  componentDidMount = () => {
    const self = this;
    setTimeout(() => {
      $(".myb-dashboard-left").on({
          mouseenter: function () {
            if (self.state.shortSidebarStyle && self.state.sidebarDocked) {
              self.expandSidebar();
            }
          },
          mouseleave: function (e) {
            const toElem = e.toElement || e.relatedTarget;
            if (!self.state.shortSidebarStyle
                && self.state.sidebarDocked
                && !(toElem.parentNode.className === 'app-menubar-item app-logo'
                || toElem.id === 'sidebar-menu-expand')
            ) {
              setTimeout(() => {
                self.expandSidebar();
              }, 250);
            }
          }
      });
    }, 1000);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.getAnotherUserInfo.loading && !nextProps.getAnotherUserInfo.loading) {
      if (this.state.sidebarOpen) {
        this.closeSidebar();
      }
      if (!this.state.shortSidebarStyle && this.state.sidebarDocked) {
        this.expandSidebar();
      }

      this.setState({
        friendStatus: 0,
        friendRequestPending: false,
      });
    }
  }

  componentDidUpdate() {
    this.subscribeToPusherChannel();
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged);
    this.unsubscribeFromPusherChannel();
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

  onSetSidebarOpen = (open) => {
    this.setState({ sidebarOpen: open });
  }

  mediaQueryChanged = () => {
    this.setState({ sidebarDocked: this.state.mql.matches });
  }

  openSidebar = () => {
    this.setState({
      sidebarOpen: true,
      shortSidebarStyle: false,
    });
  }

  closeSidebar = () => {
    this.setState({
      sidebarOpen: false,
    });
    if (this.state.shortSidebarStyle && this.state.sidebarDocked) {this.expandSidebar();}
  }

  expandSidebar = () => {
    if (this.state.shortSidebarStyle) {
      setTimeout(() => {
        this.setState({
          userCover: '/assets/default-cover-1.jpg',
        });
      }, 200);
    }
    else {
      setTimeout(() => {
        this.setState({
          userCover: '#ffffff',
        });
      }, 200);
    }
    this.setState({
      shortSidebarStyle: !this.state.shortSidebarStyle,
    });
  }

  subscribeToPusherChannel = () => {
    if (this.pusherChannelOpened) {
      return;
    }
    const { loading, currentUser } = this.props.getAnotherUserInfo;
    if (loading || !currentUser) {
      return;
    }
    this.pusherChannelOpened = true;
    const channel = this.context.userChannel;
    channel.bind('important', this.refresh);
  }

  unsubscribeFromPusherChannel = () => {
    const { loading, currentUser } = this.props.getAnotherUserInfo;
    if (loading || !currentUser) {
      return;
    }
    const channel = this.context.userChannel;
    channel.unbind('important', this.refresh);
    this.pusherChannelOpened = false;
  }

  refresh = (data) => {
    console.log('*** friendship notification ***');
    console.log(data);
    if (data.message === 'need_to_reload_notifications' && data.type === 'friendship') {
      if (data.action === 'approve') {
        this.setState({
          friendStatus: 1,
          username: this.props.getAnotherUserInfo.user.username,
          loadingState: false,
        });
        this.props.getAnotherUserInfo.refetch();
      }
      else if (data.action === 'destroy') {
        this.setState({
          friendStatus: 2,
          friendRequestPending: false,
          username: this.props.getAnotherUserInfo.user.username,
          loadingState: false,
        });
      }
      else if (data.action === 'decline') {
        this.setState({
          friendStatus: 2,
          friendRequestPending: false,
          username: this.props.getAnotherUserInfo.user.username,
          loadingState: false,
        });
      }
    }
  }

  componentWillMount() {
    if(localStorage.getItem('mbubblz_user') === '') {
      return ;
    }
    const currUser = JSON.parse(localStorage.getItem('mbubblz_user'));
    if (currUser.username === this.props.params.username) {
      this.props.router.push('/');
    }
    const mql = window.matchMedia('(min-width: 992px)');
    mql.addListener(this.mediaQueryChanged);
    this.setState({ mql: mql, sidebarDocked: mql.matches });
  }

  mediaQueryChanged = () => {
    this.setState({ sidebarDocked: this.state.mql.matches });
  }

  isFriend = () => {
    const { friendStatus } = this.state;
    if (!friendStatus) {
      const user = this.props.getAnotherUserInfo.user;
      if (!user) {
        return false;
      }
      const { friendship_status } = user;
      return (friendship_status === 'approved');
    }
    else {
      return (friendStatus === 1);
    }
  }

  isFriendRequestPending = () => {
    const user = this.props.getAnotherUserInfo.user;
    if (!user) {
      return false;
    }
    return user.friendship_status === 'pending' || this.state.friendRequestPending;
  }

  addFriend = (friend_id) => {
    const self = this;

    self.setState({
      loadingState: true,
    });

    this.props.client.mutate({
      mutation: gql`
        mutation newFriendRequest($friend_id: Int!) {
          requestFriendship(input: {friend_id: $friend_id }) {
            status
          }
        }
      `,
      variables: {
        friend_id: parseInt(friend_id),
      },
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
        self.setState({
          loadingState: false,
        });
      }
      else {
        if (data.requestFriendship.status === true) {
          self.setState({
            loadingState: false,
            friendRequestPending: true,
          });
        }
        else {
          notify.show('Friend request failed!', 'error');
          self.setState({
            loadingState: false,
          });
        }

        ReactGA.event({
          category: 'User',
          action: 'Sent a friend request',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  removeFriend = (friend_id) => {
    const self = this;

    self.setState({
      loadingState: true,
    });

    this.props.client.mutate({
      mutation: gql`
        mutation terminateFrienship($friend_id: Int!) {
          destroyFriendship(input: {friend_id: $friend_id }) {
            status
          }
        }
      `,
      variables: {
        friend_id: parseInt(friend_id),
      },
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else if (data.destroyFriendship.status === true) {
        this.props.getAnotherUserInfo.refetch();
      }
      else {
        notify.show('Failed to remove from friends!', 'error');
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  render() {
    if (this.props.getAnotherUserInfo.error) {
      if (this.props.getAnotherUserInfo.error.graphQLErrors[0].message === 'User is unauthorized') {
        setTimeout(() => {
          this.props.router.push('/signin');
        }, 50);
        setTimeout(()=> {
          localStorage.setItem('mbubblz_client_id', '');
          localStorage.setItem('mbubblz_token', '');
          localStorage.setItem('mbubblz_user', '');
          localStorage.setItem('mbubblz_username', '');
        }, 1000);
        return <div></div>;
      }
    }

    if (this.props.getAnotherUserInfo.loading) {
      return <div>
        User profile loading...
      </div>;
    }
    else {

      const onlineUsers = this.context.chatFunctions.getChatState().onlineUsers;
      const onlineUsersParsed = JSON.parse(onlineUsers);

      // Sidebar content

      const sidebarStyles = {
        root: {
          ...CommonStyles.sidebar.root,
          width: this.state.shortSidebarStyle ? '4rem' : '16rem',
          zIndex: this.state.shortSidebarStyle ? 190 : 210,
        },
        sidebar: {
          ...CommonStyles.sidebar.sidebar,
          position: (this.state.sidebarOpen ? 'fixed' : 'absolute'),
          backgroundColor: (this.state.sidebarOpen ? '#FFFFFF' : 'transparent'),
          padding: (this.state.sidebarOpen ? '30px 30px 20px' : '0'),
        },
        content: CommonStyles.sidebar.content,
        overlay: CommonStyles.sidebar.overlay,
        dragHandle: CommonStyles.sidebar.dragHandle,
      };

      const { user, currentUser } = this.props.getAnotherUserInfo;
      const { username, bubbles } = user;

      const userInfoIconStyle = {
        verticalAlign: '-25%',
        marginRight: 6,
        width: 20,
      };

      let latestGalleryImages = null;
      if (this.props.getUserMedia.userGalleryAllMedia) {
        latestGalleryImages = this.props.getUserMedia.userGalleryAllMedia.edges.map((item, index) => {
          return (<span className='image' key={index}>
            <div className='image-hover-back' onClick={() => this.handleMediaDialogOpen(item.node.id)} />
            <img src={item.node.type === 'video' ? item.node.thumb_url : item.node.small_url} role='presentation' />
            {item.node.type === 'video' ?
              <span className='zoom-image active'>
                <IconVideoPlay
                  color='#FFFFFF'
                  style={{ position: 'absolute', top: '35%', width: 40, height: 40 }}
                />
              </span>
              :
              <span className='zoom-image'>
                <IconZoom
                  color='#FFFFFF'
                  style={{ position: 'absolute', top: '35%', width: 40, height: 40 }}
                />
              </span>
            }
          </span>
          );
        });
        if (latestGalleryImages.length < 6) {
          const restImages = 6 - latestGalleryImages.length;
          for (let i = 0; i < restImages; i++) {
            latestGalleryImages.push(<span className='image default'><img src='/assets/defaults/thumb_default_avatar.jpg' /></span>);
          }
        }
      }

      const dashTab = this.props.params.dash_tab;

      const sidebarContent = <div className='user-profile'>
        <div className='myb-feed-types fixed-types'>
          <div className='user-menu-block' style={{
              height: 86,
              background: this.state.shortSidebarStyle ? '#ffffff' : '#3c455c' }}
          />
          <Link
            className='myb-feed'
            to='/'
          >
            <IconHome style={CommonStyles.iconStyle} />
            <span className='myb-feed-label'>Dashboard</span>
          </Link>
          <Link
            className={!dashTab ? 'myb-feed active' : 'myb-feed'}
            to={`/u/${username}`}
          >
            <IconActionAssignment style={CommonStyles.iconStyle} /><span className='myb-feed-label'>Feed</span>
          </Link>
          <Link
            className={dashTab === 'gallery' ? 'myb-feed active' : 'myb-feed'}
            to={`/u/${username}/gallery`}
          >
            <IconImagePhotoCamera style={CommonStyles.iconStyle} /><span className='myb-feed-label'>All photos</span>
          </Link>
          <Link
            className={dashTab === 'bubblz' ? 'myb-feed active' : 'myb-feed'}
            to={`/u/${username}/bubblz`}
          >
            <IconBubbles style={CommonStyles.iconStyle} /><span className='myb-feed-label'>Bubblz</span>
          </Link>
        </div>
      </div>;

      // Dashboard content logic

      let dashboardContent = '';

      let showDashTab = '';
      if (this.isFriend() || user.id === currentUser.id) {
        showDashTab = <UserFeed username={this.props.params.username} userid={user.id} />;
        if (dashTab === 'gallery') {
          if (this.props.params.album_id) {
            showDashTab = <UserGalleryAlbum canShare upload={false} username={this.props.params.username} album_id={parseInt(this.props.params.album_id)} />;
          }
          else {
            showDashTab = <UserGallery username={this.props.params.username} />;
          }
        }
        else if (dashTab === 'bubblz') {
          showDashTab = <UserBubblz bubbles={bubbles.edges} />;
        }
      }
      else {
        showDashTab = <NonFriendsNotAllowed
          username={username}
          isFriendRequestPending={this.isFriendRequestPending()}
          userId={user.id}
          addFriend={this.addFriend}
        />;
      }

      const isWidePage = !this.props.params.dash_tab;
      const userCover = user.cover_image_url ? user.cover_image_url : '/uploads/avatar/picture/19/thumb_default_cover.jpg.png';

      dashboardContent = (
        <div className='myb-dashboard-row' style={{ margin: 0 }}>
          <Sidebar
            rootClassName={this.state.sidebarOpen ? 'myb-dashboard-left open' :
              (this.state.shortSidebarStyle ? 'myb-dashboard-left short-style' : 'myb-dashboard-left')}
            sidebar={sidebarContent}
            open={this.state.sidebarOpen}
            docked={this.state.sidebarDocked}
            onSetOpen={this.onSetSidebarOpen}
            styles={sidebarStyles}
          >
            &nbsp;
          </Sidebar>
          <div className='myb-dashboard-center-without-right' style={{ padding: isWidePage ? '0 16px 0 0' : '40px 0' }}>
            {!dashTab ?
              <div className='current-user-info user-info-block'>
                <div className='mui-container my-profile'>
                  <div className='top-block'>
                    <div
                      className='user-background'
                      style={{backgroundImage: `url(${userCover})`, backgroundSize: 'cover'}}
                    >
                      <div className='bottom-gradient' />
                      <Interests
                        changeSearchKeyword={this.props.changeSearchKeyword}
                        isAdmin={false}
                        interests={user.interests.edges}
                      />
                    </div>
                    <div className='user-main-info'>
                      <div className='avatar-wrapper'>
                        <div className='avatar'>
                          <div className="upload-avatar">
                            <div className="show-editor">
                              <img src={user.avatar_url} />
                              <span style={onlineUsersParsed[user.id] ?
                                  { ...CommonStyles.presence.userProfileStatusStyle, ...CommonStyles.presence.onlineStyle, width: 20, height: 20, bottom: 6, right: 6, position: 'absolute' }
                                  :
                                  { ...CommonStyles.presence.userProfileStatusStyle, ...CommonStyles.presence.offlineStyle, width: 20, height: 20, bottom: 6, right: 6, position: 'absolute' }
                                } />
                            </div>
                          </div>
                        </div>
                        <h1>{user.first_name}</h1>
                        <p>@{user.username}</p>
                      </div>
                      <div className="user-main-stat-info">
                        <div className="user-bio-block">
                          <div className="user-bio">
                            {user.description ? user.description : 'No user bio yet'}
                          </div>
                          <div className="divider"/>
                          {user.zip_code ? <span>
                            <span className='caption'>
                              <svg style={userInfoIconStyle} viewBox='0 0 24 24'>
                                <path fill='#222222' d='M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z' />
                              </svg>
                            </span>
                            {user.zip_code}
                          </span>
                            :
                            null
                          }
                          &nbsp;&nbsp;
                          {user.gender ? <span>
                            <span className='caption'>
                              {user.gender === 'male' ?
                                <svg style={userInfoIconStyle} viewBox='0 0 24 24'>
                                  <path fill='#222222' d='M9,9C10.29,9 11.5,9.41 12.47,10.11L17.58,5H13V3H21V11H19V6.41L13.89,11.5C14.59,12.5 15,13.7 15,15A6,6 0 0,1 9,21A6,6 0 0,1 3,15A6,6 0 0,1 9,9M9,11A4,4 0 0,0 5,15A4,4 0 0,0 9,19A4,4 0 0,0 13,15A4,4 0 0,0 9,11Z' />
                                </svg>
                                :
                                <svg style={userInfoIconStyle} viewBox='0 0 24 24'>
                                  <path fill='#222222' d='M12,4A6,6 0 0,1 18,10C18,12.97 15.84,15.44 13,15.92V18H15V20H13V22H11V20H9V18H11V15.92C8.16,15.44 6,12.97 6,10A6,6 0 0,1 12,4M12,6A4,4 0 0,0 8,10A4,4 0 0,0 12,14A4,4 0 0,0 16,10A4,4 0 0,0 12,6Z' />
                                </svg>
                              }
                            </span>
                            {user.gender}
                          </span>
                            :
                            null
                          }
                          {
                            user.id !== currentUser.id ?
                            <div className='friend-actions'>
                              {
                                this.state.loadingState ?
                                <div>
                                  <div className='loader-wrapper' style={{ width: 'auto' }}><div className='loader' /></div>
                                </div>
                                :
                                (
                                  this.isFriend() ?
                                  (<div>
                                    <FlatButton
                                      backgroundColor='#d97575'
                                      hoverColor='#c76161'
                                      label='Remove friend'
                                      labelStyle={{ color: '#ffffff', fontSize: 12 }}
                                      style={{ width: 140, marginLeft: 0 }}
                                      onClick={this.removeFriend.bind(this, user.id)}
                                    />
                                    <FlatButton
                                      backgroundColor='#62db95'
                                      hoverColor='#308775'
                                      label='Chat'
                                      labelStyle={{ color: '#ffffff', fontSize: 12 }}
                                      style={{ width: 140, marginLeft: 16 }}
                                      onClick={this.context.chatFunctions.onOpenChatbox.bind(this, user.id)} />
                                  </div>)
                                  :
                                  <FlatButton
                                    backgroundColor={this.isFriendRequestPending() ? '#eee' : '#62db95'}
                                    hoverColor={this.isFriendRequestPending() ? '#ddd' : '#308775'}
                                    label={this.isFriendRequestPending() ? 'Request sent' : 'Add to friends'}
                                    labelStyle={{ color: this.isFriendRequestPending() ? '#aaa' : '#ffffff', fontSize: 12 }}
                                    disabled={this.isFriendRequestPending()}
                                    onClick={this.addFriend.bind(this, user.id)}
                                    style={{ width: 140, marginLeft: 0 }} />
                                )
                              }
                            </div>
                            :
                            ''
                          }
                        </div>
                        <div className="user-stat-block">
                          <Link
                            to={`/u/${user.username}/bubblz`}
                            className='view-all'
                          >
                            <span className="digit">{bubbles.edges.length}</span> Bubbles
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              :
              null
            }
            {showDashTab}
          </div>
          {/*!dashTab ?
            <div className='stat-block user-stat'>
              <div className='user-stat-row'>
                <div className='user-gallery user-column'>
                  <div className='user-header'>
                    Gallery
                    <Link
                      to='/gallery'
                      className='view-all'
                    >
                      view all
                    </Link>
                  </div>
                  <div className='content-wrapper'>
                    {latestGalleryImages}
                  </div>
                  <Dialog
                    className='gallery-media-preview'
                    modal={false}
                    open={this.state.openShowMedia}
                    onRequestClose={this.handleMediaDialogClose}
                    autoDetectWindowHeight
                    autoScrollBodyContent={!($(window).width() > 768)}
                    contentStyle={CommonStyles.dialog.gallery_content}
                    bodyStyle={CommonStyles.dialog.body}
                    style={CommonStyles.dialog.root}
                    repositionOnUpdate={false}
                  >
                    <GalleryItem media_id={this.state.mediaId} />
                  </Dialog>
                </div>
              </div>
            </div>
            :
            null
          */}
        </div>
      );

      return (
        <div>
          <div className='myb-dashboard user-page'>
            {this.state.shortSidebarStyle || !this.state.sidebarOpen ? <a id='sidebar-menu' onClick={this.openSidebar}>
                <IconMenu color={this.state.sidebarOpen ? '#3c455c' : '#FFFFFF'} style={{ width: 20, height: 20 }}/>
              </a>
              :
              null
            }
            <a id='sidebar-menu-expand' onClick={() => this.expandSidebar()}>
              <IconMenu color={this.state.sidebarOpen ? '#3c455c' : '#FFFFFF'} style={{ width: 20, height: 20 }}/>
            </a>
            {(!this.state.shortSidebarStyle && $(window).width() > 768)
              ||
              (this.state.sidebarOpen && $(window).width() < 768)
              ?
              <div className={$(window).width() > 768 ? 'app-menu-expand' : 'app-menu-expand mobile'}>
                <a className="app-menubar-item app-logo" href="/">
                  <img src="/assets/home-logo.png" role="presentation"/>
                </a>
                {/*<Link to='/' className='app-menubar-item app-logo'>
                  <IconBack color='#ffffff' style={{ verticalAlign: '-25%' }}/>
                  <span style={{ position: 'absolute', left: 32, top: 4, color: '#ffffff' }}>Back</span>
                </Link>*/}
              </div>
              :
              null
            }
            <div className='bg-dashboard my-profile'>
              <div className='mui-container my-profile'>
                {dashboardContent}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

}

export default withApollo(hoc(UserProfileContainer));
