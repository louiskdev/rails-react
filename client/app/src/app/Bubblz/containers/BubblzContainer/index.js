/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import { Link } from 'react-router';
import { notify } from 'react-notify-toast';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';

import FlatButton from 'material-ui/FlatButton';
import Sidebar from 'react-sidebar';
import Badge from 'material-ui/Badge';
import gql from 'graphql-tag';
import IconHome from 'material-ui/svg-icons/action/home';
import IconMenuIcon from 'material-ui/svg-icons/navigation/menu';
import IconMessages from 'material-ui/svg-icons/communication/message';
import IconEvents from 'material-ui/svg-icons/notification/event-note';
import IconActionAssignment from 'material-ui/svg-icons/action/assignment';
import IconSocialPeople from 'material-ui/svg-icons/social/people';
import IconImagePhotoCamera from 'material-ui/svg-icons/image/photo-camera';
import IconFiles from 'material-ui/svg-icons/editor/attach-file';
import IconContentAdd from 'material-ui/svg-icons/content/add-circle-outline';
import IconContentPaste from 'material-ui/svg-icons/content/content-paste';
import IconSettings from 'material-ui/svg-icons/action/settings';

import IconSocialGroupAdd from 'material-ui/svg-icons/social/group-add';
import IconSocialGroupRemove from 'material-ui/svg-icons/content/remove-circle';
import IconEditorBubbleChart from 'material-ui/svg-icons/editor/bubble-chart';
import IconActionDelete from 'material-ui/svg-icons/action/delete';
import IconActionSettings from 'material-ui/svg-icons/action/settings';
import Paper from 'material-ui/Paper';
import { Form as FormsyForm } from 'formsy-react';
import Dialog from 'material-ui/Dialog';
import AutoComplete from 'material-ui/AutoComplete';
import Dropzone from 'react-dropzone';
import IconBrush from 'material-ui/svg-icons/image/brush';

import ReactGA from 'react-ga';

import AvatarEditor from '@common/AvatarEditor';
import ChatWidget from '@common/ChatWidget';
import BlogWidget from '@common/BlogWidget';
import EventsWidget from '@common/EventsWidget';
import FilesWidget from '@common/FilesWidget';
import AddBubbleWidget from '@common/AddBubbleWidget';
import CommonStyles from '@utils/CommonStyles';
import BubbleInterests from '../../components/BubbleInterests';
import BubbleFeed from '../../components/BubbleFeed';
import BubbleMembersPage from '../../components/BubbleMembersPage';
import BubbleGallery from '../../components/BubbleGallery';
import BubbleGalleryAlbum from '../../components/BubbleGalleryAlbum';
import BubbleGalleryAllMedia from '../../components/BubbleGalleryAllMedia';
import BubbleManageUsers from '../../components/BubbleManageUsers';
import BubbleManageInfo from '../../components/BubbleManageInfo';
import BubbleManageWidgets from '../../components/BubbleManageWidgets';
import NonMembersNotAllowed from '../../components/NonMembersNotAllowed';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class BubblzContainer extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      counters: null,
      bubble: null,
      userCover: '#ffffff',
      sidebarOpen: false,
      sidebarDocked: false,
      shortSidebarStyle: true,
      mql: null,
      bubbleOnlineUsers: JSON.stringify({}),
      openInviteDialog: false,
      showAvatarEditor: false,
      avatarChanged: false,
      cover: '',
      coverImgs: [],
      cover_filename: '',
      files: [],
      avatar: '',
      avatar_filename: '',
      openBubbleDeleteDialog: false,
      unreadBubbleFeedItems: 0,
      unreadChatItems: 0,
      unreadGalleryItems: 0,
      unreadBlogItems: 0,
      suggestedInvitableUsers: [],
      openAddWidgetDialog: false,
    };
  }

  componentWillMount() {
    const self = this;
    const mql = window.matchMedia('(min-width: 992px)');
    mql.addListener(this.mediaQueryChanged);
    this.setState({ mql });
    this.setState({ mql: mql, sidebarDocked: mql.matches });

    const token = this.props.location.query.new_member_token;
    if (token) {
      this.props.acceptInvitation({ variables: { token: token } })
      .then((graphQLResult) => {
        const { errors, data } = graphQLResult;

        if (errors) {
          if (errors.length > 0) {
            notify.show(errors[0].message, 'error', 2000);
          }
        }
        else if (!data.acceptBubbleInvitation.confirmation_token) {
          notify.show('You accept bubble invitation!', 'success', 2000);
          self.props.router.push(`/bubbles/${self.props.params.permalink}`);
        }
        else {
          setTimeout(() => {
            self.props.router.push(`/complete_registration?confirmation_token=${data.acceptBubbleInvitation.confirmation_token}`);
          }, 200);
        }
      }).catch((error) => {
        notify.show(error.message, 'error', 2000);
      });
    }
  }

  componentDidMount = () => {
    const self = this;
    this.subscribeToBubblePresenceChannel();
    this.subscribeToBubbleChannel();
    this.getBubbleCounters();
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

  componentWillReceiveProps() {
    if (this.state.sidebarOpen) {
      this.closeSidebar();
    }
    if (!this.state.shortSidebarStyle && this.state.sidebarDocked) {
      this.expandSidebar();
    }
  }

  componentDidUpdate() {
    this.subscribeToBubbleUserChannel();
  }

  componentWillUnmount() {
    this.unsubscribeFromBubblePresenceChannel();
    this.unsubscribeFromBubbleUserChannel();
    this.unsubscribeFromBubbleChannel();
    this.state.mql.removeListener(this.mediaQueryChanged);
    this.setState({ counters: null });
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

  expandSidebar = (event) => {
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

  subscribeToBubblePresenceChannel = () => {
    const pusher = this.context.pusher;
    if (!pusher) {
      return ;
    }
    const bubblePermalink = this.props.params.permalink;
    let bubblePresenceChannel = pusher.channels.channels[`presence-bubble-${bubblePermalink}`];
    if (!bubblePresenceChannel) {
      bubblePresenceChannel = pusher.subscribe(`presence-bubble-${bubblePermalink}`);
    }

    this.bubblePresenceChannel = bubblePresenceChannel;
    this.bubblePresenceChannel.bind('pusher:subscription_succeeded', this.handleBubblePresenceEvent);
    this.bubblePresenceChannel.bind('pusher:member_added', this.handleBubblePresenceEvent);
    this.bubblePresenceChannel.bind('pusher:member_removed', this.handleBubblePresenceEvent);

    setTimeout(() => {
      this.handleBubblePresenceEvent();
    }, 10);
  }

  unsubscribeFromBubblePresenceChannel = () => {
    const pusher = this.context.pusher;
    if (!pusher) {
      return ;
    }
    const bubblePermalink = this.props.params.permalink;
    if (this.bubblePresenceChannel) {
      this.bubblePresenceChannel.unbind('pusher:subscription_succeeded', this.handleBubblePresenceEvent);
      this.bubblePresenceChannel.unbind('pusher:member_added', this.handleBubblePresenceEvent);
      this.bubblePresenceChannel.unbind('pusher:member_removed', this.handleBubblePresenceEvent);
      pusher.unsubscribe(`presence-bubble-${bubblePermalink}`);
    }
  }

  subscribeToBubbleUserChannel = () => {
    if (this.bubbleUserChannel) {
      return;
    }
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    const pusher = this.context.pusher;
    if (!pusher) {
      return ;
    }
    const permalink = this.props.params.permalink;
    const channelName = `private-bubble-${permalink}-${currentUser.id}`;
    let bubbleUserChannel = pusher.channels.channels[channelName];
    if (!bubbleUserChannel) {
      bubbleUserChannel = pusher.subscribe(channelName);
    }
    bubbleUserChannel.bind('feed_unread_items_count_changed', this.updateCounters);
    bubbleUserChannel.bind('blog_unread_items_count_changed', this.updateCounters);
    bubbleUserChannel.bind('gallery_unread_items_count_changed', this.updateCounters);
    bubbleUserChannel.bind('chat_unread_items_count_changed', this.updateCounters);
    bubbleUserChannel.bind('events_unread_items_count_changed', this.updateCounters);
    this.bubbleUserChannel = bubbleUserChannel;
  }

  unsubscribeFromBubbleUserChannel = () => {
    if (!this.bubbleUserChannel) {
      return;
    }
    const { loading, currentUser } = this.props.data;
    if (loading || !currentUser) {
      return;
    }
    const pusher = this.context.pusher;
    if (!pusher) {
      return ;
    }
    const permalink = this.props.params.permalink;
    const channelName = `private-bubble-${permalink}-${currentUser.id}`;
    this.bubbleUserChannel.unbind('feed_unread_items_count_changed');
    this.bubbleUserChannel.unbind('blog_unread_items_count_changed');
    this.bubbleUserChannel.unbind('gallery_unread_items_count_changed');
    this.bubbleUserChannel.unbind('chat_unread_items_count_changed');
    this.bubbleUserChannel.unbind('events_unread_items_count_changed');
    pusher.unsubscribe(channelName);
  }

  subscribeToBubbleChannel = () => {
    const pusher = this.context.pusher;
    if (!pusher) {
      return ;
    }
    const permalink = this.props.params.permalink;
    const channelName = `private-bubble-${permalink}`;
    let bubbleChannel = pusher.channels.channels[channelName];
    if (!bubbleChannel) {
      bubbleChannel = pusher.subscribe(channelName);
    }
    bubbleChannel.bind('need_refresh', this.refresh);
    bubbleChannel.bind('widget_added', this.refresh);
    bubbleChannel.bind('widget_disabled', this.refresh);
  }

  unsubscribeFromBubbleChannel = () => {
    const pusher = this.context.pusher;
    if (!pusher) {
      return ;
    }
    const permalink = this.props.params.permalink;
    const channelName = `private-bubble-${permalink}`;
    const bubbleChannel = pusher.channels.channels[channelName];
    if (bubbleChannel) {
      bubbleChannel.unbind('need_refresh', this.refresh);
      bubbleChannel.unbind('widget_added');
      bubbleChannel.unbind('widget_disabled');
      pusher.unsubscribe(channelName);
    }
  }

  updateCounters = (data) => {
    const countersInit = this.state.counters || {};
    const counters = JSON.parse(JSON.stringify(countersInit));

    if (data.chat_unread_items_count) {
      counters.chat_unread_items_count = this.props.params.bubble_tab !== 'chat' ? data.chat_unread_items_count : 0;
    }
    else if (data.gallery_unread_items_count) {
      counters.gallery_unread_items_count = this.props.params.bubble_tab !== 'gallery' ? data.gallery_unread_items_count : 0;
    }
    else if (data.blog_unread_items_count) {
      counters.blog_unread_items_count = this.props.params.bubble_tab !== 'blog' ? data.blog_unread_items_count : 0;
    }
    else if (data.events_unread_items_count) {
      counters.events_unread_items_count = this.props.params.bubble_tab !== 'events' ? data.events_unread_items_count : 0;
    }
    else {
      counters.feed_unread_items_count = this.props.params.bubble_tab ? data.feed_unread_items_count : 0;
    }
    this.setState({ counters });
  }

  handleBubblePresenceEvent = () => {
    if (!this.bubblePresenceChannel) {
      return;
    }
    this.setState({
      bubbleOnlineUsers: JSON.stringify(this.bubblePresenceChannel.members.members),
    });
  }

  mediaQueryChanged = () => {
    this.setState({ sidebarDocked: this.state.mql.matches });
  }

  handleDialogClose = () => {
    this.setState({
      openInviteDialog: false,
    });
  }

  getBubbleCounters = () => {
    const self = this;
    this.props.client.query({
      query: gql`
        query getBubbleCounters($permalink: String!) {
          bubbleCounters(permalink: $permalink) {
            feed_unread_items_count
            chat_unread_items_count
            gallery_unread_items_count
            blog_unread_items_count
            events_unread_items_count
            total_unread_items_count
        }
      }`,
      variables: {
        permalink: this.props.params.permalink,
      },
      forceFetch: true,
      activeCache: false,
    },
    ).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        const countersInit = data.bubbleCounters;
        const counters = JSON.parse(JSON.stringify(countersInit));

        counters.feed_unread_items_count = this.props.params.bubble_tab ? data.feed_unread_items_count : 0;

        self.setState({ counters });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  changeCounter = (counters) => {
    this.setState({ counters });
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
    const bubble = this.state.bubble && this.state.bubble.id ? this.state.bubble : this.props.data.bubble;
    const files = this.state.coverImgs;
    files[0].preview = img;
    this.setState({
      coverChanged: true,
      showAvatarEditor: false,
      coverImgs: files,
      cover: img,
    });

    const interests = []
    if (bubble.interests.edges.length > 0) {
      bubble.interests.edges.map((interest)=>{
        interests.push(interest.node.name);
      })
    }

    const vars = {
      id: parseInt(this.props.data.bubble.id, 10),
      cover_image: img,
      bubbleName: bubble.name,
      zip_code: bubble.zip_code,
      description: bubble.description,
      interests: interests,
      avatar: bubble.avatar_url,
    };

    this.props.changeBubbleCover({ variables: vars })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        notify.show('Bubble cover changed successfully!', 'success', 2000);
        this.setState({
          avatarChanged: true,
          showAvatarEditor: false,
          coverImgs: [],
          cover: data.updateBubble.bubble.cover_image_url,
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

  setNewImg = (img) => {
    const files = this.state.files;
    files[0].preview = img;
    this.setState({
      avatarChanged: true,
      showAvatarEditor: false,
      files: files,
      avatar: img,
    });

    const vars = {
      bubble_id: parseInt(this.props.data.bubble.id, 10),
      filename: this.state.avatar_filename,
      picture_file: img,
      crop_x: 0,
      crop_y: 0,
      crop_h: 0,
      crop_w: 0,
      rotation_angle: 0,
    };

    this.props.changeBubbleAvatar({ variables: vars })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        notify.show('Bubble avatar changed successfully!', 'success', 2000);
        this.setState({
          avatarChanged: true,
          showAvatarEditor: false,
          files: [],
          avatar: data.changeBubbleAvatar.bubble.avatar_url,
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  cancelNewImg = () => {
    this.setState({
      files: [],
    });
  }

  showEditor = () => {
    this.setState({
      showAvatarEditor: true,
    });
  }

  joinBubble = () => {
    const self = this;
    this.props.joinBubble({ variables: { bubble_id: parseInt(this.props.data.bubble.id, 10) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
        else {
          notify.show(errors.message, 'error', 2000);
        }
      }
      else {
        notify.show('You joined to bubble successfully!', 'success', 2000);
        self.props.data.refetch();

        ReactGA.event({
          category: 'Bubble',
          action: 'Joined a bubble',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  disjoinBubble = () => {
    const self = this;
    this.props.disjoinBubble({ variables: { bubble_id: parseInt(this.props.data.bubble.id, 10) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        if (errors.length > 0) {
          notify.show(errors[0].message, 'error', 2000);
        }
      }
      else {
        notify.show('You left bubble successfully!', 'success', 2000);
        ReactGA.event({
          category: 'Bubble',
          action: 'Disjoined a bubble',
        });
        self.props.router.push("/");
        /*self.props.data.refetch();
        self.setState({
          bubble: {},
        });*/
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  refresh = () => {
    this.props.data.refetch();
  }

  openDeleteDialog = (e) => {
    e.preventDefault();
    this.setState({
      openBubbleDeleteDialog: true,
    });
  }

  handleCloseBubbleDeleteDialog = () => {
    this.setState({
      openBubbleDeleteDialog: false,
    });
  }

  openAddWidgetDialog = () => {
    this.setState({
      openAddWidgetDialog: true,
    });
  }

  handleCloseAddWidgetDialog = () => {
    this.setState({
      openAddWidgetDialog: false,
    });
  }

  deleteBubble = () => {
    this.handleCloseBubbleDeleteDialog();
    const { bubble } = this.props.data;
    if (!bubble) {
      return;
    }

    this.props.deleteBubble({ variables: { id: parseInt(bubble.id, 10) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;

      this.handleCloseBubbleDeleteDialog();

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        notify.show('Bubble deleted successfully!', 'success', 3000);
        ReactGA.event({
          category: 'Bubble',
          action: 'Deleted a bubble',
        });
        setTimeout(() => {
          this.props.router.push('/');
        }, 10);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  getInvitableUsers = (keyword) => {
    const { bubble } = this.props.data;
    if (!bubble) {
      return;
    }
    if (keyword.length < 1) {
      this.setState({
        suggestedInvitableUsers: [],
      });
      return;
    }
    this.props.client.query({
      query: gql`
        query getInvitableUsers {
          bubbleInvitableUsers(bubble_id: ${bubble.id}, keyword: "${keyword}") {
            edges {
              node {
                id
                username
              }
            }
          }
        }
      `,
    })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (!errors) {
        const suggestedInvitableUsers = [];
        data.bubbleInvitableUsers.edges.map(user => {
          suggestedInvitableUsers.push(user.node.username);
        });
        this.setState({
          suggestedInvitableUsers,
        });
      }
    });
  }

  submitInviteForm = (data) => {
    const email = this.refs.inviteUser.state.searchText;

    this.props.client.mutate({
      mutation: gql`
        mutation inviteUser($bubble_id: Int!, $email: String!) {
          sendBubbleInvitation(input:{bubble_id: $bubble_id, email: $email }) {
            status
          }
        }
      `,
      variables: {
        bubble_id: parseInt(this.props.data.bubble.id, 10),
        email: email,
      },
    },
    ).then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
      }
      else {
        notify.show('Invite sent successfully', 'success', 3000);
        this.handleDialogClose();

        ReactGA.event({
          category: 'Bubble',
          action: 'Invited a user',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
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
    const { data } = this.props;
    const { currentUser } = data;

    if (this.props.data.errors) {
      if (this.props.data.errors[0] === 'Bubble not found or access denied' || this.props.data.errors.message !== '') {
        return (
          <div style={CommonStyles.common.boxStyle}>
            <div>
              <div>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 336 501.33334'
                  version='1.1'
                  style={CommonStyles.common.svgStyle}
                >
                  <g transform='matrix(1.3333333,0,0,-1.3333333,0,501.33333)'>
                    <g transform='scale(0.1)'>
                      <path
                        style={{ fill: '#d9dadb', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
                        d='M 680,2643.63 V 2940 c 0,319.8 260.199,580 580,580 319.8,0 580,-260.2 580,-580 v -296.37 c 1.33,-0.54 2.62,-1.05 3.95,-1.6 82.77,-35 161.56,-77.11 236.05,-125.78 V 2940 c 0,452.15 -367.85,820 -820,820 -452.148,0 -820,-367.85 -820,-820 v -423.75 c 74.488,48.67 153.281,90.78 236.051,125.78 1.328,0.55 2.621,1.06 3.949,1.6 z'
                      />
                      <path
                        style={{ fill: '#d9dadb', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
                        d='M 1260,2520 C 564.102,2520 0,1955.9 0,1260 0,564.102 564.102,0 1260,0 c 695.9,0 1260,564.102 1260,1260 0,695.9 -564.1,1260 -1260,1260 z M 1380,1195.55 V 767.07 h -240 v 428.48 c -94.61,44.92 -160,141.33 -160,253 0,154.65 125.35,280 280,280 154.65,0 280,-125.35 280,-280 0,-111.67 -65.39,-208.08 -160,-253 z'
                      />
                    </g>
                  </g>
                </svg>
              </div>
              <div style={CommonStyles.common.textStyle}>
                Bubble not found.
              </div>
            </div>
          </div>
        );
      }
    }

    if (!data.bubble || this.props.location.query.new_member_token) {
      return (<div>
        Bubble page loading...
      </div>);
    }
    else {
      const inputStyle = {
        border: '1px solid #dfdfdf',
        borderRadius: '4px',
        padding: '18px 0 0 18px',
        height: '56px',
        marginTop: '0',
      };

      const labelStyle = {
        paddingLeft: '25px',
        fontSize: '15px',
        top: '18px',
      };

      const labelFocusStyle = {
        top: '30px',
      };

      const bubble = this.state.bubble && this.state.bubble.id ? this.state.bubble : data.bubble;

      const noBubbleAccess = (<div>
        <div>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 336 501.33334'
            version='1.1'
            style={CommonStyles.common.svgStyle}
          >
            <g transform='matrix(1.3333333,0,0,-1.3333333,0,501.33333)'>
              <g transform='scale(0.1)'>
                <path
                  style={{ fill: '#d9dadb', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
                  d='M 680,2643.63 V 2940 c 0,319.8 260.199,580 580,580 319.8,0 580,-260.2 580,-580 v -296.37 c 1.33,-0.54 2.62,-1.05 3.95,-1.6 82.77,-35 161.56,-77.11 236.05,-125.78 V 2940 c 0,452.15 -367.85,820 -820,820 -452.148,0 -820,-367.85 -820,-820 v -423.75 c 74.488,48.67 153.281,90.78 236.051,125.78 1.328,0.55 2.621,1.06 3.949,1.6 z'
                />
                <path
                  style={{ fill: '#d9dadb', fillOpacity: 1, fillRule: 'nonzero', stroke: 'none' }}
                  d='M 1260,2520 C 564.102,2520 0,1955.9 0,1260 0,564.102 564.102,0 1260,0 c 695.9,0 1260,564.102 1260,1260 0,695.9 -564.1,1260 -1260,1260 z M 1380,1195.55 V 767.07 h -240 v 428.48 c -94.61,44.92 -160,141.33 -160,253 0,154.65 125.35,280 280,280 154.65,0 280,-125.35 280,-280 0,-111.67 -65.39,-208.08 -160,-253 z'
                />
              </g>
            </g>
          </svg>
        </div>
        <div style={CommonStyles.common.textStyle}>
          You can not see information of this bubble.
        </div>
      </div>);

      if (!bubble) {
        return (
          <div style={CommonStyles.common.boxStyle}>
            {noBubbleAccess}
          </div>
        );
      }
      else if (!bubble.id) {
        return (
          <div style={CommonStyles.common.boxStyle}>
            {noBubbleAccess}
          </div>
        );
      }
      else {
        const { bubbleOnlineUsers } = this.state;

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

        const badgeShortStyle = this.state.shortSidebarStyle ? {
          top: 5,
          right: -4,
          width: 16,
          height: 16,
          fontSize: 9,
          fontWeight: 400,
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
          color: '#212121',
          padding: '0 8px',
        };

        let dashboardContent = '';
        let showBubbleTab = '';
        const { id, name, avatar_url, permalink, interests } = bubble;
        const isAdmin = bubble.user_role === 'owner';
        const canManage = isAdmin || (bubble.user_role === 'moderator');
        const bubbleTab = this.props.params.bubble_tab;

        const counters = this.state.counters ? this.state.counters : {};

        const contentAllowed = !!bubble.user_role;
        const isWidePage = !this.props.params.bubble_tab;

        let joinInviteButtons = (<div style={CommonStyles.bubble.inviteButtonContainerStyle}>
          <FlatButton
            backgroundColor='#5ed28f'
            hoverColor='#308775'
            label='Join bubble'
            labelStyle={{ color: '#FFFFFF' }}
            icon={<IconSocialGroupAdd color="#ffffff" />}
            onClick={this.joinBubble}
            style={{ padding:'0px 8px'}}
          />
        </div>);

        if (bubble.kind !== 'common') {
          joinInviteButtons = (<div style={CommonStyles.bubble.inviteButtonContainerStyle}>
            <FlatButton
              backgroundColor='#5ed28f'
              hoverColor='#308775'
              label='Send request'
              labelStyle={{ color: '#FFFFFF' }}
              icon={<IconSocialGroupAdd color="#ffffff" />}
              onClick={this.joinBubble}
              style={{ padding:'0px 8px'}}
            />
          </div>);
        }

        if (isAdmin) {
          joinInviteButtons = (<div style={CommonStyles.bubble.inviteButtonContainerStyle}>
            <FlatButton
              backgroundColor='#5ed28f'
              hoverColor='#308775'
              label='Invite'
              labelStyle={{ color: '#FFFFFF' }}
              icon={<IconSocialGroupAdd color="#ffffff" />}
              onClick={() => this.setState({ openInviteDialog: true })}
              style={{ padding:'0px 8px'}}
            />
          </div>);
        }
        else if (bubble.user_role) {
          joinInviteButtons = (<div style={CommonStyles.bubble.inviteButtonContainerStyle}>
            <FlatButton
              backgroundColor='#5ed28f'
              hoverColor='#308775'
              label='Invite'
              labelStyle={{ color: '#FFFFFF' }}
              icon={<IconSocialGroupAdd color="#ffffff" />}
              onClick={() => this.setState({ openInviteDialog: true })}
              style={{ padding:'0px 8px'}}
            />
            <FlatButton
              backgroundColor='#D97575'
              hoverColor='#ab5757'
              label='Leave bubble'
              labelStyle={{ color: '#FFFFFF' }}
              icon={<IconSocialGroupRemove color="#ffffff" />}
              onClick={this.disjoinBubble}
              style={{ padding: '0px 8px', marginLeft: 8}}
            />
          </div>);
        }

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
                className={!bubbleTab ? 'myb-feed active' : 'myb-feed'}
                to={`/bubbles/${permalink}`}
                onClick={contentAllowed ? e => e : e => e.preventDefault()}
              >
              {
                counters.feed_unread_items_count ?
                  <Badge
                    badgeContent={ counters.feed_unread_items_count }
                    badgeStyle={{
                      ...badgeShortStyle,
                      backgroundColor: (
                        this.state.shortSidebarStyle ?
                          (counters.feed_unread_items_count ? '#D97575' : 'transparent')
                        :
                          (counters.feed_unread_items_count ? '#e4e4e4' : 'transparent')
                        ),
                    }}
                    style={{ padding: 0, position: 'absolute', right: 12, top: 0 }}
                  />
                :
                  null
                }
                <IconActionAssignment style={CommonStyles.iconStyle} />
                <span className='myb-feed-label'>Feed</span>
            </Link>
            <Link
              className={bubbleTab === 'members' ? 'myb-feed active' : (!contentAllowed ? 'myb-feed disabled' : 'myb-feed')}
              to={`/bubbles/${permalink}/members`}
              onClick={contentAllowed ? e => e : e => e.preventDefault()}
            >
              <IconSocialPeople style={CommonStyles.iconStyle} />
              <span className='myb-feed-label'>Members</span>
            </Link>
            { bubble.chat_widget_id ?
              <Link
                className={bubbleTab === 'chat' ? 'myb-feed active' : (!contentAllowed ? 'myb-feed disabled' : 'myb-feed')}
                to={`/bubbles/${permalink}/chat`}
                onClick={contentAllowed ? e => e : e => e.preventDefault()}
              >
                {
                  counters.chat_unread_items_count ?
                    <Badge
                      badgeContent={ counters.chat_unread_items_count }
                      badgeStyle={{
                        ...badgeShortStyle,
                        backgroundColor: (
                          this.state.shortSidebarStyle ?
                            (counters.chat_unread_items_count ? '#D97575' : 'transparent')
                          :
                            (counters.chat_unread_items_count ? '#e4e4e4' : 'transparent')
                          ),
                      }}
                      style={{ padding: 0, position: 'absolute', right: 12, top: 0 }}
                    />
                :
                  null
                }
                <IconMessages style={CommonStyles.iconStyle} />
                <span className='myb-feed-label'>Chat</span>
              </Link>
              :
              null
            }
            { bubble.gallery_widget_id ?
              <Link
                className={bubbleTab === 'gallery' ? 'myb-feed active' : (!contentAllowed ? 'myb-feed disabled' : 'myb-feed')}
                to={`/bubbles/${permalink}/gallery`}
                onClick={contentAllowed ? e => e : e => e.preventDefault()}
              >
                {counters.gallery_unread_items_count ?
                  <Badge
                    badgeContent={ counters.gallery_unread_items_count }
                    badgeStyle={{
                      ...badgeShortStyle,
                      backgroundColor: (
                        this.state.shortSidebarStyle ?
                          (counters.gallery_unread_items_count ? '#D97575' : 'transparent')
                        :
                          (counters.gallery_unread_items_count ? '#e4e4e4' : 'transparent')
                        ),
                    }}
                    style={{ padding: 0, position: 'absolute', right: 12, top: 0 }}
                  />
                :
                  null
                }
                <IconImagePhotoCamera style={CommonStyles.iconStyle} />
                <span className='myb-feed-label'>Gallery</span>
              </Link>
              :
              null
            }
            { bubble.blog_widget_id ?
              <Link
                className={bubbleTab === 'blog' ? 'myb-feed active' : (!contentAllowed ? 'myb-feed disabled' : 'myb-feed')}
                to={`/bubbles/${permalink}/blog`}
                onClick={contentAllowed ? e => e : e => e.preventDefault()}
              >
                {counters.blog_unread_items_count ?
                  <Badge
                    badgeContent={ counters.blog_unread_items_count }
                    badgeStyle={{
                      ...badgeShortStyle,
                      backgroundColor: (
                        this.state.shortSidebarStyle ?
                          (counters.blog_unread_items_count ? '#D97575' : 'transparent')
                        :
                          (counters.blog_unread_items_count ? '#e4e4e4' : 'transparent')
                        ),
                    }}
                    style={{ padding: 0, position: 'absolute', right: 12, top: 0 }}
                  />
                :
                  null
                }
                <IconContentPaste style={CommonStyles.iconStyle} />
                <span className='myb-feed-label'>Blog</span>
              </Link>
              :
              null
            }

            { bubble.events_widget_id ?
              <Link
                className={bubbleTab === 'events' ? 'myb-feed active' : (!contentAllowed ? 'myb-feed disabled' : 'myb-feed')}
                to={`/bubbles/${permalink}/events`}
                onClick={contentAllowed ? e => e : e => e.preventDefault()}
              >
                {counters.events_unread_items_count ?
                  <Badge
                    badgeContent={ counters.events_unread_items_count }
                    badgeStyle={{
                      ...badgeShortStyle,
                      backgroundColor: (
                        this.state.shortSidebarStyle ?
                          (counters.events_unread_items_count ? '#D97575' : 'transparent')
                        :
                          (counters.events_unread_items_count ? '#e4e4e4' : 'transparent')
                        ),
                    }}
                    style={{ padding: 0, position: 'absolute', right: 12, top: 0 }}
                  />
                :
                  null
                }
                <IconEvents style={CommonStyles.iconStyle} />
                <span className='myb-feed-label'>Events</span>
              </Link>
              :
              null
            }
            { bubble.files_widget_id &&
              <Link
                className={bubbleTab === 'files' ? 'myb-feed active' : (!contentAllowed ? 'myb-feed disabled' : 'myb-feed')}
                to={`/bubbles/${permalink}/files`}
                onClick={contentAllowed ? e => e : e => e.preventDefault()}
              >
                <IconFiles style={CommonStyles.iconStyle} />
                <span className='myb-feed-label'>Files</span>
              </Link>
            }
            <div className='separator' />
            {
              isAdmin ?
                <a
                  className='myb-feed'
                  href='javascript:;'
                  onClick={this.openAddWidgetDialog}
                >
                  <IconContentAdd style={CommonStyles.iconStyle} />
                  <span className='myb-feed-label'>Add widget</span>
                </a>
              :
                null
            }
          </div>
        </div>;

        // Dashboard content logic

        showBubbleTab = (<BubbleFeed
          admin={isAdmin}
          bubbleName={permalink}
          bubbleType={bubble.kind}
          counters={counters}
          changeCounter={this.changeCounter}
        />);

        if (contentAllowed) {
          if (bubbleTab === 'chat' && bubble.chat_widget_id) {
            showBubbleTab = (<ChatWidget
              bubble={bubble}
              chatWidgetId={bubble.chat_widget_id}
              counters={counters}
              changeCounter={this.changeCounter}
            />);
          }
          else if (bubbleTab === 'blog' && bubble.blog_widget_id) {
            showBubbleTab = (<BlogWidget
              admin={isAdmin}
              blogId={bubble.blog_widget_id}
              bubbleName={permalink}
              counters={counters}
              changeCounter={this.changeCounter}
            />);
          }
          else if (bubbleTab === 'gallery') {
            if (this.props.params.album_id) {
              showBubbleTab = (<BubbleGalleryAlbum
                permalink={bubble.permalink}
                canShare={bubble.kind === 'public'}
                owner={isAdmin}
                upload={!!bubble.user_role}
                bubble_id={parseInt(bubble.id, 10)}
                gallery_id={bubble.gallery_widget_id}
                album_id={parseInt(this.props.params.album_id, 10)}
              />);
            }
            else if (this.props.location.pathname.indexOf('all-media') > 0) {
              showBubbleTab = (<BubbleGalleryAllMedia
                permalink={bubble.permalink}
                canShare={bubble.kind === 'public'}
                owner={isAdmin}
                bubble_id={parseInt(bubble.id, 10)}
                gallery_id={bubble.gallery_widget_id}
              />);
            }
            else {
              showBubbleTab = (<BubbleGallery
                permalink={bubble.permalink}
                upload={!!bubble.user_role}
                bubble_id={parseInt(bubble.id, 10)}
                counters={counters}
                changeCounter={this.changeCounter}
              />);
            }
          }
          else if (bubbleTab === 'events' && bubble.events_widget_id) {
            showBubbleTab = (<EventsWidget
              eventsWidgetId={bubble.events_widget_id}
              bubbleId={bubble.id}
              counters={counters}
              changeCounter={this.changeCounter}
            />);
          }
          else if (bubbleTab === 'members') {
            showBubbleTab = (<BubbleMembersPage bubble_id={parseInt(bubble.id, 10)} onlineUsers={bubbleOnlineUsers}/>);
          }
          else if (bubbleTab === 'files' && bubble.files_widget_id) {
            showBubbleTab = (<FilesWidget
              bubble={bubble}
              currentUser={currentUser}
            />);
          }
          else if (isAdmin) {
            if (bubbleTab === 'manage-users') {
              showBubbleTab = <BubbleManageUsers openDeleteDialog={this.openDeleteDialog} bubble={bubble} />;
            }
            else if (bubbleTab === 'manage-info') {
              showBubbleTab = <BubbleManageInfo openDeleteDialog={this.openDeleteDialog} bubble={bubble} />;
            }
            else if (bubbleTab === 'manage-widgets') {
              showBubbleTab = <BubbleManageWidgets
                bubble={bubble}
                openAddWidgetDialog={this.openAddWidgetDialog}
                openDeleteDialog={this.openDeleteDialog}
                onRefresh={this.refresh} />;
            }
          }
        }
        else {
          showBubbleTab = <NonMembersNotAllowed bubbleName={bubble.name} />;
        }

        const bubbleManagementMenuStyle = {
          padding: '0px 16px 0px 50px',
          fontSize: 15,
          lineHeight: '44px',
        };

        const userInfoIconStyle = {
          verticalAlign: '-25%',
          marginRight: 6,
          width: 20,
        };
        const bubble_avatar_url = !this.state.avatar ? avatar_url : this.state.avatar;
        let bubble_cover_url = bubble.cover_image_url ? bubble.cover_image_url : '/uploads/avatar/picture/19/thumb_default_cover.jpg.png';
        if (this.state.cover) {
          bubble_cover_url = this.state.cover;
        }

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
              {!bubbleTab ?
                <div className='current-user-info bubble-info'>
                  <div className='mui-container my-profile'>
                    <div className='top-block'>
                      <div className='user-background' style={{backgroundImage: `url(${bubble_cover_url})`, backgroundSize: 'cover'}}>
                        {isAdmin ?
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
                          :
                            null
                        }
                        {isAdmin ?
                          <IconMenu
                            iconButtonElement={
                              <IconButton touch>
                                <IconSettings color='#E6EBF2'/>
                              </IconButton>
                            }
                            anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                            targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                            className='settings'
                            menuStyle={{width: '170px'}}
                            style={{position: 'absolute'}}
                          >
                            <MenuItem
                              leftIcon={<IconSocialPeople style={CommonStyles.iconStyle} />}
                              innerDivStyle={bubbleManagementMenuStyle}
                              >
                              <Link
                                to={`/bubbles/${permalink}/manage-users`}
                                style={{color: '#333'}}
                                >
                                Manage users
                              </Link>
                            </MenuItem>
                            <MenuItem
                              leftIcon={<IconEditorBubbleChart style={CommonStyles.iconStyle} />}
                              innerDivStyle={bubbleManagementMenuStyle}
                              >
                              <Link
                                to={`/bubbles/${permalink}/manage-info`}
                                style={{color: '#333'}}
                              >
                                Manage bubble
                              </Link>
                            </MenuItem>
                            <MenuItem
                              leftIcon={<IconActionSettings style={CommonStyles.iconStyle} />}
                              innerDivStyle={bubbleManagementMenuStyle}
                              >
                              <Link
                                to={`/bubbles/${permalink}/manage-widgets`}
                                style={{color: '#333'}}
                              >
                                Manage widgets
                              </Link>
                            </MenuItem>
                            <MenuItem
                              leftIcon={<IconActionDelete style={{...CommonStyles.iconStyle, color: '#d97575'}} />}
                              innerDivStyle={bubbleManagementMenuStyle}
                              >
                              <Link
                                onClick={this.openDeleteDialog}
                                style={{color: '#d97575'}}
                              >
                                Delete bubble
                              </Link>
                            </MenuItem>
                          </IconMenu>
                          :
                          null
                        }
                        <div className='bottom-gradient' />
                        <BubbleInterests
                          bubble_id={id}
                          interests={interests.edges}
                          bubblePermalink={permalink}
                          isAdmin={isAdmin}
                          changeSearchKeyword={this.props.changeSearchKeyword}
                        />
                      </div>
                      <div className='user-main-info'>
                        <div className='avatar-wrapper'>
                          <div className='avatar'>
                            {isAdmin ?
                              <Dropzone className='upload-avatar' onDrop={this.onDropDropzone} multiple={false}>
                                {this.state.files.length > 0 ?
                                  <AvatarEditor
                                    aspectRatio={1 / 1}
                                    type={this.state.files[0].type}
                                    previewImg={this.state.avatar}
                                    setNewImg={this.setNewImg}
                                    cancelNewImg={this.cancelNewImg}
                                  />
                                  :
                                  null
                                }
                                <a className='show-editor' onClick={this.showEditor.bind(this)}>
                                  <div className='show-editor-hover'>
                                    <IconBrush className='show-editor-icon' style={{ width: 36, height: 36, color: '#FFFFFF', left: '40%', top: '36%' }} />
                                  </div>
                                  <img src={bubble_avatar_url} />
                                </a>
                              </Dropzone>
                              :
                              <div className='upload-avatar'>
                                <span className='show-editor'>
                                  <img src={bubble_avatar_url} role='presentation' />
                                </span>
                              </div>
                            }
                          </div>
                          <h1>{name}</h1>
                        </div>
                        <div className="user-main-stat-info">
                          <div className="user-bio-block">
                            <div className="user-bio">
                              {bubble.description ? bubble.description : 'No bubble description yet'}
                            </div>
                            <div className="divider"/>
                            {bubble.zip_code ? <span>
                              <span className='caption'>
                                <svg style={userInfoIconStyle} viewBox='0 0 24 24'>
                                  <path fill='#222222' d='M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z' />
                                </svg>
                              </span>
                              {bubble.zip_code}
                            </span>
                              :
                              null
                            }
                            {joinInviteButtons}
                          </div>
                          <div className="user-stat-block">
                            <Link
                              to={`/bubbles/${permalink}/members`}
                              className='view-all'
                            >
                              <span className="digit">{bubble.members_count}</span> Members
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
              {showBubbleTab}
            </div>
            {/* !bubbleTab ?
              <div className='stat-block bubble-stat'>
                <div className='user-stat-row'>
                  <div className='user-friends user-column'>
                    <div className='user-header'>
                      Members
                      <Link
                        to={`/bubbles/${permalink}/members`}
                        className='view-all'
                      >
                        view all
                      </Link>
                    </div>
                    <div className='content-wrapper'>
                      <BubbleMembers bubble={bubble} onlineUsers={bubbleOnlineUsers} />
                    </div>
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
            <div className='myb-dashboard'>
              {this.state.shortSidebarStyle || !this.state.sidebarOpen  ? <a id='sidebar-menu' onClick={this.openSidebar}>
                  <IconMenuIcon color={this.state.sidebarOpen ? '#3c455c' : '#FFFFFF'} style={{ width: 20, height: 20 }}/>
                </a>
                :
                null
              }
              <a id='sidebar-menu-expand' onClick={() => this.expandSidebar()}>
                <IconMenuIcon color={this.state.sidebarOpen ? '#3c455c' : '#FFFFFF'} style={{ width: 20, height: 20 }}/>
              </a>
              {(!this.state.shortSidebarStyle && $(window).width() > 768)
                ||
                (this.state.sidebarOpen && $(window).width() < 768)
                ?
                <div className="app-menu-expand">
                  {/*<div className={$(window).width() > 768 ? 'app-menu-expand' : 'app-menu-expand mobile'}>
                    <Link to='/' className='app-menubar-item app-logo'>
                      <IconBack color='#ffffff' style={{ verticalAlign: '-25%' }}/>
                      <span style={{ position: 'absolute', left: 32, top: 4, color: '#ffffff' }}>Back</span>
                    </Link>
                  </div>*/}
                  <a className="app-menubar-item app-logo" href="/">
                    <img src="/assets/home-logo.png" role="presentation"/>
                  </a>
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
            <Dialog
              title='Invite User'
              modal={false}
              open={this.state.openInviteDialog}
              onRequestClose={this.handleDialogClose}
              contentStyle={{ ...CommonStyles.dialog.content, width: '30%' }}
              bodyStyle={CommonStyles.dialog.body}
              titleStyle={CommonStyles.dialog.title}
              overlayStyle={CommonStyles.dialog.overlay}
            >
              <FormsyForm
                noValidate
                onValidSubmit={this.submitInviteForm}
              >
                <Paper style={CommonStyles.bubble.paperStyle} zDepth={0} rounded={false}>
                  <AutoComplete
                    ref='inviteUser'
                    className='myb-autocomplete'
                    name='username'
                    floatingLabelText='Username or Email'
                    dataSource={this.state.suggestedInvitableUsers}
                    fullWidth
                    onUpdateInput={this.getInvitableUsers}
                    inputStyle={inputStyle}
                    floatingLabelStyle={labelStyle}
                    floatingLabelFocusStyle={labelFocusStyle}
                    underlineShow={false}
                  />
                </Paper>
                <div style={CommonStyles.bubble.buttonContainerStyle}>
                  <FlatButton
                    fullWidth={this.state.isSmallScreen}
                    backgroundColor={CommonStyles.outside.buttonBackgroundColor}
                    hoverColor={CommonStyles.outside.buttonHoverColor}
                    label='Invite User'
                    labelColor='#ffffff'
                    labelStyle={CommonStyles.bubble.inviteButtonLabelStyle}
                    style={CommonStyles.bubble.inviteButtonStyle}
                    type='submit'
                    formNoValidate
                  />
                </div>
              </FormsyForm>
            </Dialog>
            <Dialog
              title='Delete Bubble Confirmation'
              actions={[
                <FlatButton
                  label='Cancel'
                  primary
                  keyboardFocused
                  onTouchTap={this.handleCloseBubbleDeleteDialog}
                />,
                <FlatButton
                  label='Delete'
                  secondary
                  onTouchTap={this.deleteBubble}
                />,
              ]}
              modal={false}
              open={this.state.openBubbleDeleteDialog}
              onRequestClose={this.handleCloseBubbleDeleteDialog}
            >
              Are you really sure you want to delete this bubble?<br />
              <strong>This can not be undone.</strong>
            </Dialog>
            <Dialog
              title='Add Widget'
              modal={false}
              open={this.state.openAddWidgetDialog}
              onRequestClose={this.handleCloseAddWidgetDialog}
              autoScrollBodyContent
              contentStyle={CommonStyles.dialog.content}
              bodyStyle={CommonStyles.dialog.body}
              titleStyle={CommonStyles.dialog.title}
              style={{ zIndex: 0, padding: 0 }}
            >
              <AddBubbleWidget
                bubble={bubble}
                onRefresh={this.refresh}
                onRequestClose={this.handleCloseAddWidgetDialog} />
            </Dialog>
          </div>
        );
      }
    }
  }

}

BubblzContainer.propTypes = {
  params: React.PropTypes.object,
  data: React.PropTypes.object,
  location: React.PropTypes.object,
  mutations: React.PropTypes.object,
  query: React.PropTypes.func,
  router: React.PropTypes.object,
  counters: React.PropTypes.object,
  mutate: React.PropTypes.func,
};

export default withApollo(hoc(BubblzContainer));
