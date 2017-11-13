/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import { Link } from 'react-router';
import Avatar from 'material-ui/Avatar';
import Sidebar from 'react-sidebar';
import gql from 'graphql-tag';
import Badge from 'material-ui/Badge';
import IconMenu from 'material-ui/svg-icons/navigation/menu';
import IconMessages from 'material-ui/svg-icons/communication/message';
import IconEvents from 'material-ui/svg-icons/notification/event-note';
import IconActionAssignment from 'material-ui/svg-icons/action/assignment';
import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconImagePhotoCamera from 'material-ui/svg-icons/image/photo-camera';
import IconNearMe from 'material-ui/svg-icons/maps/near-me';
import IconLocation from 'material-ui/svg-icons/communication/location-on';
import IconHelp from 'material-ui/svg-icons/action/help-outline';
import IconBubbles from 'material-ui/svg-icons/action/donut-small';
import IconZoom from 'material-ui/svg-icons/action/zoom-in';
import IconSettings from 'material-ui/svg-icons/action/settings';
import IconVideoPlay from 'material-ui/svg-icons/av/play-circle-filled';
import IconContentAdd from 'material-ui/svg-icons/content/add-circle-outline';
import { notify } from 'react-notify-toast';

import Dropzone from 'react-dropzone';
import Dialog from 'material-ui/Dialog';
import CreateOrUpdateBubble from '@common/CreateOrUpdateBubble';
import IconBrush from 'material-ui/svg-icons/image/brush';
import AvatarEditor from '@common/AvatarEditor';
import MyBubbles from '@common/MyBubbles';
import MyFeed from '@dashboard/components/MyFeed';
import FriendsFeed from '@dashboard/components/FriendsFeed';
import HashtagFeed from '@dashboard/components/HashtagFeed';
import SinglePage from '@dashboard/components/SinglePage';
import Gallery from '@common/Gallery';
import GalleryAlbum from '@common/GalleryAlbum';
import GalleryAllMedia from '@common/GalleryAllMedia';
import Messages from '@dashboard/components/Messages';
import Notifications from '@dashboard/components/Notifications';
import FriendNotifications from '@dashboard/components/FriendNotifications';
import Events from '@dashboard/components/Events';
import NearYouBubblz from '@dashboard/components/NearYouBubblz';
import NearYouPeople from '@dashboard/components/NearYouPeople';
import MyFriends from '@dashboard/components/MyFriends';
import NotFound from '@common/NotFound';
import MyInterests from '@common/MyInterests';

import Updates from '@common/StaticPages/Updates';
import CommonStyles from '@utils/CommonStyles';
import { withApollo } from 'react-apollo';
import hoc from './hoc';

class DashboardContainer extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    chatFunctions: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      mediaId: null,
      openShowMedia: false,
      userCover: '#ffffff',
      sidebarOpen: false,
      sidebarDocked: false,
      shortSidebarStyle: true,
      mql: null,
      unreadFriendsNotifs: null,
      openCreateBubbles: false,
      openMessageFriendId: 0,
      unreadMessageCount: 0,
      currentUserId: null,
      clickedItem: '',
      showAvatarEditor: false,
      cover: '',
      coverImgs: [],
      cover_filename: '',
      description: '',
      descriptionFocus: false,
      zip_code: '',
      zip_codeFocus: false,
      avatarChanged: false,
      files: [],
      avatar: '',
      avatar_filename: '',
      viewMoreInterestingPeoples: false,
      viewMoreTrendingBubbles: false,
    };
  }

  componentWillMount = () => {
    const mql = window.matchMedia('(min-width: 768px)');
    mql.addListener(this.mediaQueryChanged);
    this.setState({ mql: mql, sidebarDocked: mql.matches });

    this.subscribeToDashboardChannel();
  }

  componentDidMount = () => {
    const self = this;
    setTimeout(() => {
      this.getFriendsFeedNotifs();
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
    if (this.state.sidebarOpen) {
      this.closeSidebar();
    }

    if (!this.state.shortSidebarStyle && this.state.sidebarDocked) {
      this.expandSidebar();
    }

    if (nextProps.unreadMessageCount && this.props.unreadMessageCount !== nextProps.unreadMessageCount) {
      this.setState({
        unreadMessageCount: nextProps.unreadMessageCount,
      });
    }
  }

  componentWillUnmount = () => {
    this.setState({
      unreadFriendsNotifs: null,
    });
    this.state.mql.removeListener(this.mediaQueryChanged);
    this.unsubscribeFromDashboardChannel();
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

  subscribeToDashboardChannel = () => {
    const self = this;
    const pusher = this.context.pusher;
    if (localStorage.getItem('mbubblz_user') === '') {
      setTimeout(() => {
        this.props.router.push('/signin');
      }, 50);
      return ;
    }
    const currentUser = JSON.parse(localStorage.getItem('mbubblz_user'));
    let channel = pusher.channels.channels[`private-dashboard-${currentUser.id}`];
    if (!channel) {
      channel = pusher.subscribe(`private-dashboard-${currentUser.id}`);
    }

    this.setState({
      currentUserId: currentUser.id,
    });

    channel.bind('feed_item_added', (data) => {
      self.setState({
        unreadFriendsNotifs: data.unread_activities_count,
      });
    });
  }

  unsubscribeFromDashboardChannel = () => {
    const pusher = this.context.pusher;
    let currentUserId = this.state.currentUserId;
    if (localStorage.getItem('mbubblz_user')) {
      currentUserId = JSON.parse(localStorage.getItem('mbubblz_user')).id;
    } else {
      return ;
    }
    const channel = pusher.channels.channels[`private-dashboard-${currentUserId}`];
    if (channel) {
      channel.unbind('feed_item_added');
      // pusher.unsubscribe("private-dashboard-" + currentUserId);
    }
  }

  onSetSidebarOpen = (open) => {
    this.setState({ sidebarOpen: open });
  }

  mediaQueryChanged = () => {
    this.setState({ sidebarDocked: this.state.mql.matches });
  }

  openSidebar = () => {
    setTimeout(() => {
      this.setState({
        userCover: '/assets/default-cover-1.jpg',
      });
    }, 200);
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

  /* Message open */

  onOpenMessage = (friendId) => {
    const { unreadMessageCount } = this.context.chatFunctions.getChatState();
    unreadMessageCount[friendId] = 0;
    this.context.chatFunctions.setChatState({
      unreadMessageCount: unreadMessageCount,
      __need_for_updating: Math.random() * 10000,
    });
    this.setState({
      openMessageFriendId: friendId,
    });
  }

  onCloseMessage = () => {
    this.context.chatFunctions.setChatState({
      __need_for_updating: Math.random() * 10000,
    });
    this.setState({
      openMessageFriendId: 0,
    });
  }

  getFriendsFeedNotifs = () => {
    const self = this;

    this.props.client.query({
      query: gql`
        query getFriendsFeed {
          friends_feed(first: 1, touch: true) {
            unread_activities_count
          }
        }
      `,
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

        // Update feed data
        if (data.friends_feed) {
          self.setState({
            unreadFriendsNotifs: data.friends_feed.unread_activities_count,
          });
        }
      }

    }).catch((error) => {
      if (error.message.indexOf('User is unauthorized') > 0) {

      }
      else {
        notify.show(error.message, 'error', 2000);
      }

    });
  }

  handleViewMoreInterestingPeoples = (viewMore) => {
    const { viewMoreTrendingBubbles } = this.state;
    this.setState({
      viewMoreInterestingPeoples: viewMore,
      viewMoreTrendingBubbles: !viewMore && viewMoreTrendingBubbles,
    });
  }

  handleViewMoreTrendingBubbles = (viewMore) => {
    const { viewMoreInterestingPeoples } = this.state;
    this.setState({
      viewMoreInterestingPeoples: !viewMore && viewMoreInterestingPeoples,
      viewMoreTrendingBubbles: viewMore,
    });
  }

  onDropDropzone = (files) => {
    const self = this;

    const file = files[0];
    const reader = new FileReader();

    if (file.size / 1024 / 1024 > 10) {
      notify.show('You can upload image of max 10mb size', 'error');
      return;
    }

    reader.addEventListener('load', function() {
      self.setState({
        avatar: reader.result,
      });
    }, false);
    if (file) {
      this.setState({
        files: files,
        avatar_filename: file.name,
      });
      reader.readAsDataURL(file);
    }
  }

  setNewImg = (img, cropData) => {
    const files = this.state.files;
    let vars = {
      filename: this.state.avatar_filename,
      picture_file: img,
      crop_x: -1,
      crop_y: -1,
      crop_h: -1,
      crop_w: -1,
      rotation_angle: 0,
    };

    if (files[0].type === 'image/gif') {
      vars = {
        filename: this.state.avatar_filename,
        picture_file: img,
        crop_x: cropData.x,
        crop_y: cropData.y,
        crop_w: cropData.width,
        crop_h: cropData.height,
        rotation_angle: cropData.rotate,
        //file: files[0]
      };
      this.setState({
        avatarChanged: true,
        showAvatarEditor: false,
        files: files,
        avatar: img,
      });
    }
    else {
      files[0].preview = img;
      this.setState({
        avatarChanged: true,
        showAvatarEditor: false,
        files: files,
        avatar: img,
      });
    }

    this.props.changeUserAvatar({ variables: vars })
    .then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        notify.show('Your avatar changed successfully!', 'success', 2000);
        const newUser = JSON.parse(localStorage.getItem('mbubblz_user'));
        newUser.avatar_url = data.changeUserAvatar.user.avatar_url;
        localStorage.setItem('mbubblz_user', JSON.stringify(newUser));
        this.setState({
          avatarChanged: false,
          showAvatarEditor: false,
          files: [],
          avatar: '',
        });
      }

    }).catch((error) => {

      notify.show(error.message, 'error', 2000);

    });
  }

  cancelNewImg = () => {
    this.setState({
      files: [],
      showAvatarEditor: false,
    });
  }

  handleDialogCreateBubbleOpen = () => {
    this.setState({
      openCreateBubbles: true,
    });
  };

  handleDialogCreateBubbleClose = (path) => {
    this.props.router.push(path);
    this.setState({
      openCreateBubbles: false,
    });
  };

  onDropDropzoneBackground = (files) => {
    const self = this;

    const file = files[0];
    const reader = new FileReader();

    if (file.size / 1024 / 1024 > 10) {
      notify.show('You can upload image of max 10mb size', 'error');
      return;
    }

    reader.addEventListener('load', function() {
      self.setState({
        cover: reader.result,
      });
    }, false);

    if (file) {
      this.setState({
        coverImgs: files,
        cover_filename: file.name,
      });
      reader.readAsDataURL(file);
    }
  }

  setNewCover = (img) => {
    const user = this.state.user && this.state.user.id ? this.state.user : JSON.parse(localStorage.getItem('mbubblz_user'));
    const files = this.state.coverImgs;
    files[0].preview = img;
    this.setState({
      coverChanged: true,
      showAvatarEditor: false,
      coverImgs: files,
      cover: img,
    });

    const interests = []
    if (user.interests.edges.length > 0) {
      user.interests.edges.map((interest)=>{
        interests.push(interest.node.name);
      })
    }

    const vars = {
      ...user,
      interests: interests,
      cover_image: img,
    };

    this.props.changeUserData({ variables: vars })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        notify.show('User cover changed successfully!', 'success', 2000);
        const newUser = JSON.parse(localStorage.getItem('mbubblz_user'));
        newUser.cover_image_url = data.updateUser.user.cover_image_url;
        localStorage.setItem('mbubblz_user', JSON.stringify(newUser));
        this.setState({
          cover: '',
          coverImgs: [],
        });

      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  cancelNewCover = () => {
    this.setState({
      coverImgs: [],
    });
  }

  showEditor = () => {
    this.setState({
      showAvatarEditor: true,
    });
  }

  saveUserDescription = () => {
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));

    const interests = []
    if (user.interests.edges.length > 0) {
      user.interests.edges.map((interest)=>{
        interests.push(interest.node.name);
      });
    }

    const desc = this.state.description ? this.state.description.replace('\n', '') : '';

    const vars = {
      ...user,
      interests: interests,
      description: desc,
    };

    this.props.changeUserData({ variables: vars })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        //notify.show('User decsription changed successfully!', 'success', 2000);
        const newUser = JSON.parse(localStorage.getItem('mbubblz_user'));
        newUser.description = data.updateUser.user.description || '';
        localStorage.setItem('mbubblz_user', JSON.stringify(newUser));
        this.setState({
          description: newUser.description,
          descriptionFocus: false,
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  saveUserZipCode = () => {
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));

    const interests = []
    if (user.interests.edges.length > 0) {
      user.interests.edges.map((interest)=>{
        interests.push(interest.node.name);
      });
    }

    const vars = {
      ...user,
      interests: interests,
      zip_code: this.state.zip_code.replace('\n', ''),
    };

    this.props.changeUserData({ variables: vars })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        //notify.show('User decsription changed successfully!', 'success', 2000);
        const newUser = JSON.parse(localStorage.getItem('mbubblz_user'));
        newUser.zip_code = data.updateUser.user.zip_code || '';
        localStorage.setItem('mbubblz_user', JSON.stringify(newUser));
        this.setState({
          zip_code: newUser.zip_code,
          zip_codeFocus: false,
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  render() {

    if (this.props.data.error) {
      if (this.props.data.error.graphQLErrors[0].message === 'User is unauthorized') {
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

    if (this.props.data.loading) {
      return <div>
        Dashboard loading...
      </div>;
    }
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

    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    let activeCache = null;
    if (localStorage.getItem('mbubblz_activeCache')) {
      activeCache = JSON.parse(localStorage.getItem('mbubblz_activeCache'));
    }
    const { unreadMessageCount } = this.context.chatFunctions ? this.context.chatFunctions.getChatState() : 0;

    let unreadMessageCountNumber = 0;
    if (Object.keys(unreadMessageCount).length > 0) {
      for (const k in unreadMessageCount) {
        unreadMessageCountNumber = unreadMessageCountNumber + unreadMessageCount[k];
      }
    }

    const currentUser = JSON.parse(localStorage.getItem('mbubblz_user'));
    const badgeShortStyle = this.state.shortSidebarStyle ? {
      top: 5,
      right: -4,
      width: 16,
      height: 16,
      fontSize: 9,
      fontWeight: 400,
      backgroundColor: (unreadMessageCount ? '#D97575' : 'transparent'),
      color: '#FFFFFF',
    }
    :
    {
      top: 8,
      right: -6,
      fontWeight: 'bold',
      fontSize: 11,
      width: 'auto',
      height: '26px',
      borderRadius: '2px',
      backgroundColor: (unreadMessageCount ? '#e4e4e4' : 'transparent'),
      color: '#212121',
      padding: '0 8px',
    };

    const unreadFriendsFeedNotifs = this.state.unreadFriendsNotifs > -1
    ?
      this.state.unreadFriendsNotifs
    :
      0;

    let userCover = user.cover_image_url ? user.cover_image_url : '/uploads/avatar/picture/19/thumb_default_cover.jpg.png';
    if (this.state.coverImgs.length > 0) {
      userCover = this.state.coverImgs[0].preview;
    }

    const sidebarContent = <div>
      <div className='myb-feed-types fixed-types'>
        <div className='user-menu-block' style={{backgroundImage: `url(${userCover})`, backgroundSize: 'cover'}}>
          <a className='myb-feed'>
            <Avatar
              src={currentUser.avatar_url}
              size={26}
              style={{
                borderRadius: '50%',
                marginLeft: '10px',
                marginTop: '-2px',
              }}
            />
            <span className='myb-feed-label'>{currentUser.first_name}</span>
          </a>
          <div className="bottom-gradient"/>
        </div>
        <Link
          className={this.props.location.pathname === '/' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/' ? null : '/'}
        >
          <IconActionAssignment style={CommonStyles.iconStyle} /><span className='myb-feed-label'>My Profile</span>
        </Link>
        <Link
          className={this.props.location.pathname === '/friends' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/friends' ? null : '/friends'}
        >
          <IconSocialPeople style={CommonStyles.iconStyle} />
          <span className='myb-feed-label'>Friends activity</span>
          {unreadFriendsFeedNotifs > 0 ? <Badge
          badgeContent={ unreadFriendsFeedNotifs }
          badgeStyle={badgeShortStyle}
          style={{ padding: 0, position: 'absolute', right: 12, top: 0 }}
          />
          :
          null
          }

        </Link>
        <Link
          className={this.props.location.pathname === '/people-near-you' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/people-near-you' ? null : '/people-near-you'}
        >
          <IconLocation style={CommonStyles.iconStyle} /><span className='myb-feed-label'>People near you</span>
        </Link>
        <Link
          className={this.props.location.pathname === '/bubblz-near-you' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/bubblz-near-you' ? null : '/bubblz-near-you'}
        >
          <IconNearMe style={CommonStyles.iconStyle} /><span className='myb-feed-label'>Bubblz near you</span>
        </Link>
        <Link
          className={this.props.location.pathname === '/messages' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/messages' ? null : '/messages'}
        >
          <IconMessages style={CommonStyles.iconStyle} />
          <span className='myb-feed-label'>Messages</span>
          {unreadMessageCountNumber > 0 ? <Badge
          badgeContent={ unreadMessageCountNumber }
          badgeStyle={badgeShortStyle}
          style={{ padding: 0, position: 'absolute', right: 12, top: 0 }}
          />
          :
          null
          }

        </Link>
        <Link
          className={this.props.location.pathname === '/gallery' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/gallery' ? null : '/gallery'}
        >
          <IconImagePhotoCamera style={CommonStyles.iconStyle} /><span className='myb-feed-label'>Gallery</span>
        </Link>
        <Link
          className={this.props.location.pathname === '/mybubbles' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/mybubbles' ? null : '/mybubbles'}
        >
          <IconBubbles style={CommonStyles.iconStyle} /><span className='myb-feed-label'>My Bubbles</span>
        </Link>
        <Link
          className={this.props.location.pathname === '/events' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/events' ? null : '/events'}
        >
          <IconEvents style={CommonStyles.iconStyle} /><span className='myb-feed-label'>Events</span>
        </Link>
        <div className='separator' />

        {$(window).width() < 480 ?
          <Link className='myb-feed' onClick={this.handleDialogCreateBubbleOpen}>
            <IconContentAdd style={CommonStyles.iconStyle} />
            <span className='myb-feed-label'>Add bubble</span>
          </Link>
          :
          null
        }

        <Link
          className={this.props.location.pathname === '/help' ? 'myb-feed active' : 'myb-feed'}
          to={this.props.location.pathname === '/help' ? null : '/help'}
        >
          <IconHelp style={CommonStyles.iconStyle} /><span className='myb-feed-label'>Help</span>
        </Link>
      </div>
    </div>;

    // Dashboard content logic

    const { __need_for_updating } = this.context.chatFunctions.getChatState();
    const { openMessageFriendId, viewMoreInterestingPeoples, viewMoreTrendingBubbles } = this.state;

    let showDashTab = <NotFound />;

    let dashboardContent = '';
    if (this.props.params.activity_id) {
      showDashTab = <SinglePage activity_id={this.props.params.activity_id} />;
    }
    else if (this.props.params.dash_tab === 'news_and_updates') {
      showDashTab = <Updates />;
    }
    else if (!this.props.params.dash_tab) {
      showDashTab = <MyFeed activeCache={activeCache} />;
    }
    else if (this.props.params.dash_tab === 'messages') {
      showDashTab = <Messages
                openMessageFriendId={openMessageFriendId}
                onOpenMessage={this.onOpenMessage}
                onCloseMessage={this.props.onCloseMessage}
                unreadMessageCount={unreadMessageCount}
                __need_for_updating={__need_for_updating} />;
    }
    else if (this.props.params.dash_tab === 'notifications') {
      showDashTab = <Notifications />;
    }
    else if (this.props.params.dash_tab === 'friendnotifications') {
      showDashTab = <FriendNotifications />;
    }
    else if (this.props.params.dash_tab === 'events') {
      showDashTab = <Events />;
    }
    else if (this.props.params.dash_tab === 'people-near-you') {
      showDashTab = <NearYouPeople />;
    }
    else if (this.props.params.dash_tab === 'bubblz-near-you') {
      showDashTab = <NearYouBubblz />;
    }
    else if (this.props.params.dash_tab === 'myfriends') {
      showDashTab = <MyFriends />;
    }
    else if (this.props.params.dash_tab === 'friends') {
      showDashTab = <FriendsFeed activeCache={activeCache} loadMorePosts={unreadFriendsFeedNotifs} setUnreadPosts={() => { this.setState({unreadFriendsNotifs: 0});} } />;
    }
    else if (this.props.params.dash_tab === 'hashtags') {
      const hashtag = this.props.params.subparam;
      showDashTab = <HashtagFeed hashtag={hashtag} activeCache={activeCache} />;
    }
    else if (this.props.params.dash_tab === 'gallery') {
      if (this.props.params.album_id) {
        showDashTab = <GalleryAlbum upload album_id={parseInt(this.props.params.album_id)} />;
      }
      else if (this.props.location.pathname.indexOf('all-media') > 0) {
        showDashTab = <GalleryAllMedia upload/>;
      }
      else {
        showDashTab = <Gallery upload/>;
      }
    }
    else if (this.props.params.dash_tab === 'mybubbles') {
      showDashTab = <MyBubbles />;
    }

    let userFriends = [];
    if (this.props.getMyFriends.currentUser) {
      userFriends = this.props.getMyFriends.currentUser.friends.edges.map((friend, index) => {
        let truncatedString = friend.node.first_name;
        if (truncatedString.length > 6) {
          truncatedString = `${truncatedString.substring(0, 6)}...`;
        }

        return <span className='stat-item' key={index}>
          <div className='friend-wrapper'>
            <Link to={`/u/${friend.node.username}`}>
              <img src={friend.node.avatar_url} />
            </Link>
            <div className='friend-info'>
              <Link className='friend-name' to={`/u/${friend.node.username}`}>
                {truncatedString}
              </Link>
            </div>
          </div>
        </span>;
      });
    }

    let userBubbles = [];
    if (this.props.getMyBubbles.my_bubbles) {
      userBubbles = this.props.getMyBubbles.my_bubbles.edges.map((bubble, index) => {
        let truncatedString = bubble.node.name;
        if (truncatedString.length > 14) {
          truncatedString = `${truncatedString.substring(0, 14)}...`;
        }

        return <span className='stat-item' key={index}>
          <div className='bubble-wrapper'>
            <Link to={`/bubbles/${bubble.node.permalink}`}>
              <img src={bubble.node.avatar_url} />
            </Link>
            <div className='bubble-info'>
              <Link className='bubble-name' to={`/bubbles/${bubble.node.permalink}`}>
                {truncatedString}
              </Link>
              <div className='bubble-description'>
                {bubble.node.description}
              </div>
            </div>
          </div>
        </span>;
      });
    }

    let latestGalleryImages = [];
    if (this.props.data.myGalleryAllMedia) {
      latestGalleryImages = this.props.data.myGalleryAllMedia.edges.map((item, index) => {
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
      if (latestGalleryImages.length < 3 && latestGalleryImages.length > 0) {
        const restImages = 3 - latestGalleryImages.length;
        for (let i = 0; i < restImages; i++) {
          latestGalleryImages.push(<span className='image default'><img src='/assets/defaults/thumb_default_avatar.jpg' /></span>);
        }
      }
    }

    let topHashtags = [];
    if (this.props.getTrendingHashtags.trendingHashtags) {
      topHashtags = this.props.getTrendingHashtags.trendingHashtags.edges.map((tag, index) => {
        return <span className='tag-item' key={index}>
          <div className='tag-wrapper'>
            <Link to={`/hashtags/${tag.node.name}`}>
              #{tag.node.name}
            </Link>
            <div className='tag-times'>{tag.node.posts_count} times</div>
          </div>
        </span>;
      });
    }

    let userBirthdays = [];
    if (this.props.getMyFriends.currentUser) {
      userBirthdays = this.props.getMyFriends.currentUser.birthday_friends.edges.map((friend, index) => {
        let truncatedString = friend.node.first_name;
        if (truncatedString.length > 6) {
          truncatedString = `${truncatedString.substring(0, 6)}...`;
        }

        return <span className='stat-item' key={index}>
          <div className='friend-wrapper'>
            <Link to={`/u/${friend.node.username}`}>
              <img src={friend.node.avatar_url} />
            </Link>
            <div className='friend-info'>
              <Link className='friend-name' to={`/u/${friend.node.username}`}>
                {truncatedString}
              </Link>
            </div>
          </div>
        </span>;
      });
    }

    const isWidePage = (!this.props.params.dash_tab
      && !this.props.params.activity_id)
      || this.props.params.dash_tab === 'friends';

    const myPages = this.props.params.dash_tab === 'mybubbles'
      || this.props.params.dash_tab === 'myfriends'
      || this.props.params.dash_tab === 'bubblz-near-you'
      || this.props.params.dash_tab === 'people-near-you';

    const userInfoIconStyle = {
      verticalAlign: '-20%',
      width: 18,
      marginRight: 2,
    };

    const user_avatar_url = this.state.files.length > 0 ? this.state.files[0].preview : user.avatar_url;

    dashboardContent = (
      <div className='myb-dashboard-row' style={{ margin: isWidePage ? '0' : '0 -15px' }}>
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
          { !this.props.params.dash_tab && !this.props.params.activity_id ?
            <div className='current-user-info'>
              <div className='mui-container my-profile'>
                <div className='top-block'>
                  <div
                    className='user-background'
                    style={{backgroundImage: `url(${userCover})`, backgroundSize: 'cover'}}
                  >
                    <Dropzone className='upload-background' onDrop={this.onDropDropzoneBackground} multiple={false}>
                      {this.state.coverImgs.length > 0 ?
                          <AvatarEditor
                            aspectRatio={7.22 / 3}
                            type={this.state.coverImgs[0].type}
                            previewImg={this.state.cover}
                            setNewImg={this.setNewCover}
                            cancelNewImg={this.cancelNewCover}
                          />
                        :
                        null
                      }
                      <a
                        className='show-editor'
                        style={{width: '100%', height: 300, zIndex: 10}}
                        onClick={this.showEditor.bind(this)}
                      >
                        <div className='show-editor-hover' style={{borderRadius: 0}}>
                          <IconBrush className='show-editor-icon' style={{ width: 36, height: 36, color: '#FFFFFF', left: '5%', top: '5%' }} />
                        </div>
                      </a>
                    </Dropzone>
                    <Link to={`/u/${user.username}/settings`} className='settings'><IconSettings color='#E6EBF2'/></Link>
                    <div className='bottom-gradient' />
                    <MyInterests
                      changeSearchKeyword={this.props.changeSearchKeyword}
                      isAdmin={true}
                    />
                  </div>
                  <div className='user-main-info'>
                    <div className='avatar-wrapper'>
                      <div className='avatar'>
                        <Dropzone className='upload-avatar' onDrop={this.onDropDropzone} multiple={false}>
                          {this.state.files.length > 0 ?
                            <AvatarEditor aspectRatio={1 / 1} type={this.state.files[0].type} previewImg={this.state.avatar} setNewImg={this.setNewImg} cancelNewImg={this.cancelNewImg} />
                            :
                            null
                          }
                          <a className='show-editor' onClick={this.showEditor.bind(this)}>
                            <div className='show-editor-hover'>
                              <IconBrush className='show-editor-icon' style={{ width: 36, height: 36, color: '#FFFFFF', left: '40%', top: '36%' }} />
                            </div>
                            <img src={user_avatar_url} />
                          </a>
                        </Dropzone>
                      </div>
                      <h1>{user.first_name}</h1>
                      <p>@{user.username}</p>
                    </div>
                    <div className="user-main-stat-info">
                      <div className="user-bio-block">
                        <div
                          className="user-bio"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={this.saveUserDescription}
                          onFocus={()=> {
                            if (!user.description) {
                              this.setState({
                                description: '',
                                descriptionFocus: true,
                              })
                            }
                            else {
                              this.setState({
                                description: user.description,
                                descriptionFocus: true,
                              })
                            }
                          }}
                          onKeyPress={(event)=> {
                            var keyCode = event.which || event.keyCode;
                            if (keyCode === 13){
                              event.preventDefault()
                              this.saveUserDescription()
                              $(".user-bio").blur();
                            }
                          }}
                          onInput={(event)=> {
                            this.setState({
                              description: event.currentTarget.innerText,
                            })
                          }}
                        >
                          { (!user.description)
                            && !this.state.descriptionFocus
                            ?
                            'Write a short bio about yourself'
                            :
                            user.description
                          }
                        </div>
                        <div className="divider"/>
                        {user.zip_code ? <div>
                          <span className='caption'>
                            <svg style={userInfoIconStyle} viewBox='0 0 24 24'>
                              <path fill='#222222' d='M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z' />
                            </svg>
                          </span>
                          <span
                            className="user-zip-code"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={this.saveUserZipCode}
                            onFocus={()=> {
                              if (user.zip_code === '') {
                                this.setState({
                                  zip_code: '',
                                  zip_codeFocus: true,
                                })
                              }
                              else {
                                this.setState({
                                  zip_code: user.zip_code,
                                  zip_codeFocus: true,
                                })
                              }
                            }}
                            onKeyPress={(event)=> {
                              var keyCode = event.which || event.keyCode;
                              if (keyCode === 13){
                                event.preventDefault()
                                this.saveUserZipCode()
                                $(".user-zip-code").blur();
                              }
                            }}
                            onInput={(event)=> {
                              this.setState({
                                zip_code: event.currentTarget.innerText,
                              })
                            }}
                          >
                            {user.zip_code}
                          </span>
                        </div>
                          :
                          null
                        }
                        {user.gender ? <div>
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
                        </div>
                          :
                          null
                        }
                      </div>
                      <div className="user-stat-block">
                        <Link
                          to='/mybubbles'
                          className='view-all'
                        >
                          <span className="digit">{userBubbles.length}</span> Bubbles
                        </Link>
                        <Link
                          to='/myfriends'
                          className='view-all'
                        >
                          <span className="digit">{ userFriends.length }</span> Friends
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
          <Dialog
            title='Create Bubble'
            modal={false}
            open={this.state.openCreateBubbles}
            onRequestClose={this.handleDialogCreateBubbleClose}
            autoScrollBodyContent
            contentStyle={{ ...CommonStyles.dialog.content, width: '30%' }}
            bodyStyle={CommonStyles.dialog.body}
            titleStyle={CommonStyles.dialog.title}
          >
            <CreateOrUpdateBubble closeDialog={this.handleDialogCreateBubbleClose} refetchBubbles={this.refetchBubbles} />
          </Dialog>
          {showDashTab}
        </div>
        {/* !this.props.params.dash_tab && !this.props.params.activity_id ?
          <div className='stat-block'>
            <div className='user-stat-row'>
              <div className='user-friends user-column'>
                <div className='user-header'>
                  { userFriends.length } Friends
                  { userFriends.length > 0 ?
                    <Link
                      to='/myfriends'
                      className='view-all'
                    >
                      view all
                    </Link>
                    :
                    null
                  }
                </div>
                <div className='content-wrapper'>
                  {userFriends.length > 0 ? userFriends : 'Friends not found'}
                </div>
              </div>
              <div className='user-bubbles user-column'>
                <div className='user-header'>
                  {userBubbles.length} Bubbles
                  {userBubbles.length > 0 ?
                    <Link
                      to='/mybubbles'
                      className='view-all'
                    >
                      view all
                    </Link>
                    :
                    null
                  }
                </div>
                <div className='content-wrapper'>
                  {userBubbles.length > 0 ? userBubbles : 'Bubbles not found'}
                </div>
              </div>
              <div className='user-gallery user-column'>
                <div className='user-header'>
                  Gallery
                  {latestGalleryImages.length > 0 ?
                    <Link
                      to='/gallery'
                      className='view-all'
                    >
                      view all
                    </Link>
                    :
                    null
                  }
                </div>
                <div className='content-wrapper'>
                  {latestGalleryImages.length > 0 ? latestGalleryImages : 'No images'}
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
        }
        { this.props.params.dash_tab === 'friends' ?
          <div className='stat-block'>
            <div className='user-stat-row'>
              <div className='top-tags user-column'>
                <div className='user-header'>
                  Trending tags
                  <Link
                    to='/hashtags'
                    className='view-all'
                  >
                    view all
                  </Link>
                </div>
                <div className='content-wrapper'>
                  {topHashtags.length > 0 ? topHashtags : 'Hashtags not found'}
                </div>
              </div>
              {userBirthdays.length > 0 ?
                <div className='user-friends user-column'>
                  <div className='user-header'>
                    Birthdays
                    <Link
                      to='/myfriends'
                      className='view-all'
                    >
                      view all
                    </Link>
                  </div>
                  <div className='content-wrapper'>
                    {userBirthdays}
                  </div>
                </div>
                :
                null
              }
            </div>
          </div>
          :
          null
        */}
        </div>
    );

    let bgClassName = 'bg-dashboard';
    if (isWidePage) {
      bgClassName = 'bg-dashboard my-profile';
    }
    if (this.props.params.dash_tab === 'friends') {
      bgClassName = 'bg-dashboard my-profile friends-feed';
    }
    if (myPages) {
      bgClassName = 'bg-dashboard my-pages';
    }

    return (
      <div className='myb-dashboard'>
        <a id='sidebar-menu' onClick={this.openSidebar}>
          <IconMenu color='#FFFFFF' style={{ width: 20, height: 20 }}/>
        </a>
        <a id='sidebar-menu-expand' onClick={() => this.expandSidebar()}>
          <IconMenu color='#FFFFFF' style={{ width: 20, height: 20 }}/>
        </a>
        <div className='app-menu-expand'>
          <Link to='/' className='app-menubar-item app-logo'>
            <img src='/assets/home-logo.png' role='presentation' />
          </Link>
        </div>
        <div className={ bgClassName }>
          <div className={ isWidePage || myPages ? 'mui-container my-profile' : 'mui-container'}>
            {dashboardContent}
          </div>
        </div>
      </div>
    );
  }

}

export default withApollo(hoc(DashboardContainer));
