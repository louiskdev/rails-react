/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import IconMoreVert from 'material-ui/svg-icons/navigation/more-vert';
import IconToggleStarActive from 'material-ui/svg-icons/toggle/star';
import IconToggleStar from 'material-ui/svg-icons/toggle/star-border';
import IconActionFavoriteActive from 'material-ui/svg-icons/action/favorite';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite-border';
import IconImageRemoveRedEye from 'material-ui/svg-icons/image/remove-red-eye';
import IconCommunicationChatBubble from 'material-ui/svg-icons/communication/chat-bubble-outline';
import IconClock from 'material-ui/svg-icons/device/access-time';
import IconPlace from 'material-ui/svg-icons/maps/place';
import IconZoom from 'material-ui/svg-icons/action/zoom-in';
import Slider from 'material-ui/Slider';
import FlatButton from 'material-ui/FlatButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { emojify } from 'react-emojione2';
import Dialog from 'material-ui/Dialog';
import CommonStyles from '@utils/CommonStyles';
import InputField from '@common/InputField';
import BTimeAgo from '@common/BTimeAgo';
import LazyLoad from 'react-lazyload';

import CommentItem from '@common/CommentItem';
import CreateComment from '@common/CreateComment';
import GalleryItem from '@common/GalleryItem';
import VideoItem from '@common/VideoItem';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

class FeedItem extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    userChannel: React.PropTypes.object,
    globalChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      user_avatar: '',
      mediaId: null,
      draggingSlider: false,
      rateSliderValue: 0,
      openShowMedia: false,
      stopLinkScrape: false,
      itemCommented: false,
      loadingComments: true,
      openLikers: false,
      mounted: false,
    };
  }

  formatDateTime = (date) => {
    const _date = new Date(date);
    const month = _date.getMonth() + 1;
    let dstr = '';
    dstr = dstr + _date.getFullYear() + '-';
    dstr = dstr + (month < 10 ? '0' : '') + month + '-';
    dstr = dstr + (_date.getDate() < 10 ? '0' : '') + _date.getDate() + ' ';
    const h = _date.getHours() % 12;
    dstr = dstr + ' at ' + (h < 10 ? '0' : '') + h + ':00 ';
    const h_am_pm = _date.getHours() < 12 ? 'AM' : 'PM';
    dstr = dstr + h_am_pm;
    return dstr;
  }

  componentWillMount = () => {
    this.listenPusher();
  }

  componentWillUnmount = () => {
    this.unlistenPusher();
    this.setState({
      mounted: false,
    });
  }

  componentDidMount = () => {
    const self = this;
    // const { feednode } = this.props;
    // const feeditem = feednode || {};
    /*if (feeditem.object_type !== 'Bubble' && feeditem.object_type !== 'Event') {
      setTimeout(() => {
        this.showComments(feeditem.shared ? 'Activity' : feeditem.object_type, feeditem.shared ? feeditem.id : feeditem.object_id, false);
        this.changeStatus({
          showCommentsBlock: true,
        });
      }, 500);
    }*/
    $(document).on('scroll', function() {
      $('video').each(function() {
        if (self.isInView($(this)[0])) {                    // visible?
          if ($(this)[0].paused) $(this)[0].play();    // play if not playing
        }
        else {
          if (!$(this)[0].paused) {$(this)[0].pause();}  // pause if not paused
        }
      });
    });

    this.setState({
      mounted: true,
    });
  }

  isInView = (el) => {
    const rect = el.getBoundingClientRect();           // absolute position of video element
    return !(rect.top > $(window).height() || rect.bottom < 0);   // visible?
  }

  listenPusher = () => {
    const userChannel = this.context.userChannel;
    const globalChannel = this.context.globalChannel;

    userChannel.bind('avatar_changed', this.handleAvatarChanged);
    userChannel.bind('friend_avatar_changed', this.handleFriendAvatarChanged);
    globalChannel.bind('likes_count_changed', this.handleLikesCountChanged);
    globalChannel.bind('comment_removed', this.onCommentItemEventRemoved);
    globalChannel.bind('comments_count_changed', this.handleCommentsCountChanged);
    globalChannel.bind('Note_visits_count_changed', this.handleNotesVisitsCountChanged);
    globalChannel.bind('post_visits_count_changed', this.handlePostVisitsCountChanged);
  }

  unlistenPusher = () => {
    const userChannel = this.context.userChannel;
    const globalChannel = this.context.globalChannel;
    userChannel.unbind('avatar_changed', this.handleAvatarChanged);
    userChannel.unbind('friend_avatar_changed', this.handleFriendAvatarChanged);
    globalChannel.unbind('likes_count_changed', this.handleLikesCountChanged);
    globalChannel.unbind('comment_removed', this.onCommentItemEventRemoved);
    globalChannel.unbind('comments_count_changed', this.handleCommentsCountChanged);
    globalChannel.unbind('Note_visits_count_changed', this.handleNotesVisitsCountChanged);
    globalChannel.unbind('post_visits_count_changed', this.handlePostVisitsCountChanged);
    this.setState({
      progressUpdating: false,
    });
    clearTimeout(this.timeoutID);
  }

  handleAvatarChanged = (data) => {
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const newObj = {};
    newObj[`user_avatar_${user.username}`] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  }

  handleFriendAvatarChanged = (data) => {
    const newObj = {};
    newObj[`user_avatar_${data.user_data.username}`] = data.user_data.thumb_avatar_url;
    this.setState(newObj);
  };

  handleLikesCountChanged = (data) => {
    const self = this;
    const obj = self.getStatus();
    if (obj) {
      if (data.message.object_id === parseInt(obj.id, 10) && data.message.object_type !== 'Comment') {
        const user = JSON.parse(localStorage.getItem('mbubblz_user'));
        // liked should change only when initiator is current user
        let liked = obj.liked;
        if (data.message.user.id == user.id) {
          liked = (data.message.type != 'unliked');
        }
        if (obj.likes_count < 10) {
          const newLiker = {
            __typename: 'UserEdge',
            node: {
              __typename: 'User',
              username: data.message.user.username,
              first_name: data.message.user.first_name,
            },
          };
          let newLikers = obj.likers.edges;
          if (data.message.type === 'unliked') {
            newLikers = newLikers.filter((e) => e.node.username !== data.message.username);
          }
          else if (user.username === data.message.username) {
            newLikers = [newLiker];
            newLikers = newLikers.concat(obj.likers.edges);
          }
          else {
            newLikers.push(newLiker);
          }
          self.changeStatus({
            liked,
            likes_count: data.message.likes_count,
            likers: {
              edges: newLikers,
              other_likers_count: obj.likes_count > 3 ? data.message.likes_count - 3 : 0,
            },
          });
        }
        else {
          self.changeStatus({
            liked,
            likes_count: data.message.likes_count,
            likers: {
              edges: obj.likers.edges,
              other_likers_count: data.message.likes_count - 2,
            },
          });
        }
      }
    }
  }

  handleCommentsCountChanged = (data) => {
    const self = this;
    const obj = self.getStatus();
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    if (obj) {
      if (data.message.object_id === parseInt(obj.id, 10)) {
        const diffComments = self.getStatus().new_comments_count ? self.getStatus().new_comments_count + 1 : 1;
        if (data.message.username === user.username && this.state.itemCommented) {
          self.changeStatus({
            comments_count: data.message.comments_count,
            new_comments_count: 0,
          });
          this.setState({
            itemCommented: false,
          });
        }
        else {
          self.changeStatus({
            comments_count: data.message.comments_count,
            new_comments_count: diffComments,
          });
        }
      }
    }
  }

  handleNotesVisitsCountChanged = (data) => {
    const self = this;
    const obj = self.getStatus();
    if (obj) {
      if (data.message.object_id === parseInt(obj.id, 10)) {
        self.changeStatus({
          visits_count: data.message.visits_count,
        });
      }
    }
  }

  handlePostVisitsCountChanged = (data) => {
    const self = this;
    const obj = self.getStatus();
    if (obj) {
      if (data.message.object_id === parseInt(obj, 10).id) {
        self.changeStatus({
          visits_count: data.message.visits_count,
        });
      }
    }
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

  changeStatus = (stats) => {
    this.props.updateFeedStatus(this.props.index, stats);
  }

  getStatus = () => {
    let feedObj = {};
    const { feednode } = this.props;
    if (feednode.name) {
      if (feednode.name.substr(0, 5) === 'notes') {
        feedObj = feednode.o_note;
      }
      else if (feednode.name.substr(0, 7) === 'bubbles') {
        feedObj = feednode.o_bubble;
      }
      else if (feednode.name.substr(0, 6) === 'albums') {
        feedObj = feednode.o_medium || feednode.o_album;
      }
      else if (feednode.name.substr(0, 5) === 'media') {
        feedObj = feednode.o_medium;
      }
      else if (feednode.name.substr(0, 9) === 'galleries') {
        feedObj = feednode.o_medium || feednode.o_album;
      }
      else if (feednode.name.substr(0, 10) === 'activities') {
        feedObj = feednode.o_note ||
          feednode.o_bubble ||
          feednode.o_medium ||
          feednode.o_album ||
          feednode.o_post;
      }
      else if (feednode.name.substr(0, 5) === 'blogs') {
        feedObj = feednode.o_post;
      }
      else if (feednode.name.substr(0, 6) === 'events') {
        feedObj = feednode.o_event;
      }
    }
    else {
      feedObj = feednode;
    }
    return feedObj;
  }

  likeUnlikeFeedItem = (objectType, objectId, liked) => {
    const self = this;
    const currItem = self.getStatus();

    let likeMutation = '';

    let returnObjType = 'Note';
    if (objectType === 'Widgets::BlogWidget::Post') {
      returnObjType = 'Post';
    }
    else if (objectType === 'Medium') {
      returnObjType = objectType;
    }
    else if (objectType === 'Album') {
      returnObjType = objectType;
    }

    likeMutation = gql`
      mutation LikeFeeditem($object_type: String!, $object_id: Int!) {
        createLike(input: {
          object_type: $object_type,
          object_id: $object_id
        }) {
          object {
            ... on ${returnObjType} {
              id
              liked
              likes_count
            }
          }
        }
      }
    `;

    if (liked) {
      likeMutation = gql`
        mutation LikeFeeditem($object_type: String!, $object_id: Int!) {
          destroyLike(input: {
            object_type: $object_type,
            object_id: $object_id
          }) {
            object {
              ... on ${returnObjType} {
                liked
                likes_count
              }
            }
          }
        }
      `;
    }

    const likesCount = liked ? currItem.likes_count - 1 : currItem.likes_count + 1;

    self.changeStatus({
      liked: !currItem.liked,
      likes_count: likesCount,
    });

    if (likeMutation) {
      this.props.client.mutate({
        mutation: likeMutation,
        variables: {
          object_type: objectType,
          object_id: objectId,
        },
      }).then((graphQLResult) => {
        const { errors, data } = graphQLResult;

        if (errors) {
          if (errors[0]) {
            // notify.show(errors[0].message, 'error');
          }
          else {
            // notify.show(errors.message, 'error');
          }
        }
        else {
          const likesNewCount = data.createLike ? data.createLike.object.likes_count : data.destroyLike.object.likes_count;
          const likedStatus = data.createLike ? data.createLike.object.liked : data.destroyLike.object.liked;

          if (likedStatus !== currItem.liked) {
            self.changeStatus({
              liked: likedStatus,
              likes_count: likesNewCount,
            });
          }
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
  }

  updateCommentAndEndEditing = (index, replyIndex, vars) => {
    const newCommentsInit = this.getStatus().comments;
    const newComments = JSON.parse(JSON.stringify(newCommentsInit));

    const commentsCount = parseInt(this.getStatus().comments_count, 10);
    if (replyIndex > -1) {
      newComments.edges[replyIndex].node.comments.edges[index].node.text = vars.text;
      if (vars.link_url) {
        const linkPreview = {
          description: vars.link_description || '',
          picture_url: vars.link_picture_url || '',
          title: vars.link_title || '',
          url: vars.link_url,
        };
        newComments.edges[replyIndex].node.comments.edges[index].node.link_preview = linkPreview;
      }
      else {
        newComments.edges[replyIndex].node.comments.edges[index].node.link_preview = null;
      }
    }
     else {
      newComments.edges[index].node.text = vars.text;
      if (vars.link_url) {
        const linkPreview = {
          description: vars.link_description || '',
          picture_url: vars.link_picture_url || '',
          title: vars.link_title || '',
          url: vars.link_url,
        };
        newComments.edges[index].node.link_preview = linkPreview;
      }
      else {
        newComments.edges[index].node.link_preview = null;
      }
    }
    this.changeStatus({
      comments: newComments,
      comments_count: commentsCount,
      total_comments: commentsCount,
      new_comments_count: 0,
    });
  }

  /*onCommentItemRemoved = (index, replyIndex) => {
    const newCommentsInit = this.getStatus().comments;
    const newComments = JSON.parse(JSON.stringify(newCommentsInit));

    let commentsCount = parseInt(this.getStatus().comments_count, 10);

    if (replyIndex > -1) {
      newComments.edges[replyIndex].node.comments.edges.splice(index, 1)
    }
    else {
      if (newComments.edges[index].node.comments) {
        commentsCount = commentsCount - newComments.edges[index].node.comments.edges.length;
      }
      newComments.edges.splice(index, 1);
    }

    this.changeStatus({
      comments: newComments,
      comments_count: commentsCount - 1,
      total_comments: commentsCount - 1,
      new_comments_count: 0,
    });
  }*/

  onCommentItemEventRemoved = (data) => {
    const newCommentsInit = this.getStatus().comments;
    const newComments = JSON.parse(JSON.stringify(newCommentsInit));

    let commentsCount = parseInt(this.getStatus().comments_count, 10);

    if (data.message.object_id === parseInt(this.getStatus().id, 10)) {
      for (let i = 0; i < newComments.edges.length; i++) {
        if (newComments.edges[i].node.comments) {
          for (let j = 0; j < newComments.edges[i].node.comments.edges.length; j++) {
            if (parseInt(newComments.edges[i].node.comments.edges[j].node.id, 10) === data.message.comment_id) {
              newComments.edges[i].node.comments.edges.splice(j, 1);
            }
          }
        }
        if (parseInt(newComments.edges[i].node.id, 10) === data.message.comment_id) {
          if (newComments.edges[i].node.comments) {
            commentsCount = commentsCount - newComments.edges[i].node.comments.edges.length;
          }
          newComments.edges.splice(i, 1);
        }
      }
      this.changeStatus({
        comments: newComments,
        comments_count: commentsCount - 1,
        total_comments: commentsCount - 1,
        new_comments_count: 0,
      });
    }
  }

  showComments(objectType, objectId, hideComments) {
    const self = this;
    const commentsObj = this.getStatus().comments;
    if (!hideComments || (!commentsObj || commentsObj.length === 0)) {
      const commentObject = `
        author {
          id
          username
          avatar_url(version: "micro")
        }
        body
        commentable_id
        commentable_type
        created_at
        id
        liked
        likes_count
        subject
        text
        title
        user_id
        link_preview {
          description
          id
          picture_url
          title
          url
        }
        medium {
          id
          picture_url
          thumb_url
          video_links
          recoding_job_id
        }
        comments {
          edges {
            cursor  #pagination field
            node {
              author {
                id
                username
                avatar_url(version: "micro")
              }
              body
              commentable_id
              commentable_type
              created_at
              id
              liked
              likes_count
              subject
              text
              title
              user_id
              link_preview {
                description
                id
                picture_url
                title
                url
              }
              medium {
                id
                picture_url
                thumb_url
                video_links
                recoding_job_id
              }
            }
          }
        }
      `;

      let variables = {
        last: 5,
        // before: loadMore === 'prev' ? commentsObj[0].cursor : commentsObj[commentsObj.length - 1].cursor,
        object_type: objectType,
        object_id: parseInt(objectId, 10),
      };
      let params = '$last: Int!, $object_type: String!, $object_id: Int!';
      let query = 'last: $last, object_type: $object_type, object_id: $object_id';

      if (this.props.location) {
        if (this.props.location.query) {
          variables = {
            last: 5,
            // before: loadMore === 'prev' ? commentsObj[0].cursor : commentsObj[commentsObj.length - 1].cursor,
            targeted_comment_id: parseInt(this.props.location.query.comment_id, 10),
            object_type: objectType,
            object_id: parseInt(objectId, 10),
          };
          params = '$last: Int!, $object_type: String!, $object_id: Int!, $targeted_comment_id: Int!';
          query = 'last: $last, object_type: $object_type, object_id: $object_id, targeted_comment_id: $targeted_comment_id';
        }
      }
      this.props.client.query({
        query: gql`
          query getComments(${params}) {
            rootCommentsForObject(${query}) {
              edges {
                cursor  #pagination field
                node {
                  ${commentObject}
                }
              }
              total_count
            }
          }
        `,
        variables: variables,
        forceFetch: true,
      }).then((graphQLResult) => {
        const { errors, data } = graphQLResult;

        if (errors) {
          notify.show(errors[0].message, 'error');
        }
        else {
          if (!hideComments) {
            self.changeStatus({
              new_comments_count: 0,
              comments: data.rootCommentsForObject,
              total_comments: data.rootCommentsForObject.total_count,
            });
          }
          else {
            self.changeStatus({
              comments: data.rootCommentsForObject,
              total_comments: data.rootCommentsForObject.total_count,
            });
          }
          this.setState({
            itemCommented: false,
            loadingComments: false,
          });
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }

    /*if (hideComments && (commentsObj || commentsObj.length !== 0)) {
      this.changeStatus({
        showCommentsBlock: !this.getStatus().showCommentsBlock,
      });
    }*/
  }

  itemCommented = () => {
    this.setState({
      itemCommented: true,
    });
  }

  updateComments = (data) => {
    const newCommentsInit = this.getStatus().comments || [];
    const newComment = {
      __typename: 'CommentEdge',
      node: data.createComment.comment,
    };

    if (!newCommentsInit) {
      return;
    }
    const newComments = JSON.parse(JSON.stringify(newCommentsInit));
    newComments.edges.push(newComment);

    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const commentsCount = parseInt(this.getStatus().comments_count, 10);
    if (newComment.node.username === user.username) {
      this.changeStatus({
        comments: newComments,
        comments_count: commentsCount,
        total_comments: commentsCount,
        new_comments_count: 0,
      });
    }
    else {
      this.changeStatus({
        comments: newComments,
        comments_count: commentsCount,
        total_comments: commentsCount,
      });
    }
  }

  updateReplyComments = (commentIndex, data) => {
    const comments = this.getStatus().comments;
    const newComment = {
      __typename: 'CommentEdge',
      node: data.createComment.comment,
    };
    if (comments.edges[commentIndex]) {
      if (!comments.edges[commentIndex].node.comments) {
        comments.edges[commentIndex].node.comments = {
          edges: [],
        };
      }
      comments.edges[commentIndex].node.comments.edges.push(newComment);
      this.changeStatus({ comments });
    }
  }

  toggleRater = (e) => {
    e.stopPropagation();
    if (!this.props.ratable) {
      return;
    }
    const rateVisible = !!this.getStatus().rateVisible;
    this.changeStatus({
      rateVisible: !rateVisible,
    });
  }

  onRateChangeStart = () => {
    this.setState({
      draggingSlider: true,
      rateSliderValue: this.refs.rateSlider.state.value,
    });
  }

  onRateSliding = () => {
    this.setState({
      rateSliderValue: this.refs.rateSlider.state.value,
    });
  }

  onRateChange = () => {
    const newRating = this.refs.rateSlider.state.value;
    const { object_type, object_id } = this.props.feednode;

    this.props.rateObject({ variables: {
      object_type: object_type,
      object_id: object_id,
      rating: parseInt(newRating),
    } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
        this.setState({
          draggingSlider: false,
        });
      }
      else {
        const { rating, raters_count } = data.rateObject.object;
        this.changeStatus({
          user_rating: newRating,
          rating: rating,
          raters_count: raters_count,
        });
        this.setState({
          draggingSlider: false,
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      this.setState({
        draggingSlider: false,
      });
    });
  }

  onEdit = () => {
    if (this.props.feednode.name === 'notes.create' ||
      this.props.feednode.name === 'blogs.create_post' ||
      this.props.editable) {
      this.changeStatus({
        editingText: true,
      });
    }
    else {
      return;
    }
  }

  onMessageEditDone = (vars) => {
    if (this.props.feednode.name !== 'notes.create' &&
      this.props.feednode.name !== 'blogs.create_post') {
      return;
    }

    this.changeStatus({
      editingText: false,
    });

    if (this.props.feednode.name === 'notes.create') {
      const noteId = this.props.feednode.object_id;
      this.props.updateNote({ variables: { ...vars, id: noteId } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          if (errors[0]) {
            notify.show(errors[0].message, 'error');
          }
          else {
            notify.show(errors.message, 'error');
          }
        }
        else {
          this.props.updateNoteAndEndEditing(this.props.index, vars);
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
    else if (this.props.feednode.name === 'blogs.create_post') {
      const postId = this.props.feednode.object_id;
      this.props.updatePost({ variables: { ...vars, id: postId } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          if (errors[0]) {
            notify.show(errors[0].message, 'error');
          }
          else {
            notify.show(errors.message, 'error');
          }
        }
        else {
          this.props.updateNoteAndEndEditing(this.props.index, vars);
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
  }

  onEditKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.onMessageEditDone();
    }
    else if (e.keyCode === 27) {
      this.changeStatus({
        editingText: false,
      });
    }
  }

  onShare = () => {
    const id = this.props.feednode.id;
    this.props.shareActivity({ variables: { id: parseInt(id) } })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {
        notify.show('Successfully shared the activity', 'success');
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  onHide = () => {

    const user = JSON.parse(localStorage.getItem('mbubblz_user'));

    const vars = {
      id: parseInt(this.props.feednode.id),
      location: this.props.feed_location,
      feed_user_id: this.props.feed_location === 'user_feed' ? 0 : parseInt(user.id),
    };

    this.props.hideActivity({ variables: vars })
    .then((graphQLResult) => {
      const { errors } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  onRemove = () => {

    if (!!this.props.feednode.shared) {
      const noteId = this.props.feednode.id;

      this.props.deleteSharedPost({ variables: { id: parseInt(noteId) } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          if (errors[0]) {
            notify.show(errors[0].message, 'error');
          }
          else {
            notify.show(errors.message, 'error');
          }
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
    else if (this.props.feednode.name === 'notes.create') {
      const noteId = this.props.feednode.object_id;

      this.props.deleteNote({ variables: { id: parseInt(noteId) } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          if (errors[0]) {
            notify.show(errors[0].message, 'error');
          }
          else {
            notify.show(errors.message, 'error');
          }
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
    else if (this.props.feednode.name === 'blogs.create_post') {
      const postId = this.props.feednode.object_id;

      this.props.deletePost({ variables: { id: parseInt(postId) } })
      .then((graphQLResult) => {
        const { errors } = graphQLResult;
        if (errors) {
          if (errors[0]) {
            notify.show(errors[0].message, 'error');
          }
          else {
            notify.show(errors.message, 'error');
          }
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
  }

  onReplyMessage = (feedIndex, commentIndex) => {
    this.props.enableReply(feedIndex, commentIndex);
  }

  processTextObjects = (rawText, emojiOptions, link_preview) => {
    if (rawText.indexOf('dropbox.com') > -1) {
      return '';
    }

    let text = emojify(rawText
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>'),
       emojiOptions
    );

    if (text) {
      /* Process mentions and hashtags */
      const textBefore = text;
      const nameRegExp = /([#|@][a-zA-Z0-9\_]+)/;
      text = [];
      textBefore.map((item, index) => {
        if (typeof item === 'string') {
          // debugger;
          let item1 = item;
          let match = null;
          while (match = nameRegExp.exec(item1)) {
            const foundMention = match[0];
            const _name = match[1];
            const name = _name.substr(1);
            const isMention = (_name.substr(0, 1) === '@');
            const foundPos = match.index;
            if (foundPos > 0) {
              text.push(item1.substr(0, foundPos));
            }
            if (name.length > 0) {
              if (isMention) {
                text.push({
                  type: 'Link',
                  element: <Link to={`/u/${name}`}>@{name}</Link>,
                });
              }
              else {
                text.push({
                  type: 'Link',
                  element: <Link to={`/hashtags/${name}`}>#{name}</Link>,
                });
              }
            }
            item1 = item1.substr(foundPos + foundMention.length);
          }
          if (item1) {
            text.push(item1);
          }
        }
        else {
          text.push(item);
        }
      });

      /* Process urls */
      text = text.map((item, index) => {
        let item1 = item;
        let newItem = item;
        if (typeof newItem === 'string') {
          if (newItem.indexOf('..') > -1) {
            return newItem;
          }
          let match = [];
          // Deal with urls that has http or https first
          do {
            const urlRegex = new RegExp(/(http|https):\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig);
            match = urlRegex.exec(item1);

            if (match !== null) {
              const link = match[0];
              item1 = item1.replace(link, '');
              newItem = link_preview ? item1 : newItem.replace(link, `<a href="${link}" class="out-link" target="_blank" rel="noreferrer noopener">${link}</a>`);
            }
          } while (match);
          // Now process urls that doesn't have protocol part
          do {
            const urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig);
            match = urlRegex.exec(item1);

            if (match !== null) {
              const link = match[0];
              item1 = item1.replace(link, '');
              newItem = link_preview ? item1 : newItem.replace(link, `<a href="http://${link}" class="out-link" target="_blank" rel="noreferrer noopener">${link}</a>`);
            }
          } while (match);
        }
        return newItem;
      });
    }
    return text;
  }

  loadFirstComment = (feeditem) => {
    this.changeStatus({
      new_comments_count: 0,
    });
    setTimeout(() => {
      this.showComments(feeditem.shared ? 'Activity' : feeditem.object_type, feeditem.shared ? feeditem.id : feeditem.object_id, false);
    }, 100);
  }

  renderImage = (imageId, imgSrc) => {
    return (<span key={imageId} className='image'>
      <div className='image-hover-back' onClick={() => this.handleMediaDialogOpen(imageId)} />
      <img src={imgSrc} role='presentation' />
      <span className='zoom-image'>
        <IconZoom
          color='#FFFFFF'
          style={{ position: 'absolute', top: '45%', width: 44, height: 44 }}
        />
      </span>
    </span>
    );
  }

  render() {
    const { feednode } = this.props;
    const feeditem = feednode || {};
    let typeMessage = '';

    const feedObj = this.getStatus();
    if (!feedObj) {
      return (
        <div className={this.props.index === 0 ? 'myb-message empty first' : 'myb-message empty'} id={feeditem.id}>
          <div className='message-inner'>
            Item not found
          </div>
        </div>
      );
    }

    const randomKey = Math.random() * 10000;
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));

    if (feeditem.name === 'activities.share') {
    }
    else {
      if (feeditem.name === 'bubbles.create') {
        if (feeditem.bubble) {
          typeMessage = (<span>
            created the bubble&nbsp;
            <Link key={randomKey} to={`/bubbles/${feedObj.permalink}`}>{feedObj.name}</Link>
          </span>);
        }
        else if (feeditem.o_bubble) {
          typeMessage = (<span>
            created the bubble&nbsp;
            <Link key={randomKey} to={`/bubbles/${feeditem.o_bubble.permalink}`}>{feeditem.o_bubble.name}</Link>
          </span>);
        }
      }
      else if (feeditem.name === 'bubbles.disjoin_user' || feeditem.name === 'bubbles.join_user') {
        if (this.props.feed_location === 'bubble_feed') {
          typeMessage = <span>{feednode.user_friendly_name}</span>;
        }
        else {
          typeMessage = (<span>
            {feednode.user_friendly_name}&nbsp;
            <Link key={randomKey} to={`/bubbles/${feedObj.permalink}`}>{feedObj.name}</Link>
          </span>);
        }
      }
      else if (feeditem.name.substr(0, 7) === 'bubbles') {
        if (this.props.feed_location === 'bubble_feed') {
          typeMessage = <span>{feednode.user_friendly_name}</span>;
        }
        else if (feeditem.bubble) {
          typeMessage = (<span>
              {feednode.user_friendly_name} in bubble&nbsp;
              <Link key={randomKey} to={`/bubbles/${feedObj.permalink}`}>{feedObj.name}</Link>
            </span>);
        }
        else if (feeditem.o_bubble) {
          typeMessage = (<span>
              {feednode.user_friendly_name} in bubble&nbsp;
              <Link key={randomKey} to={`/bubbles/${feeditem.o_bubble.permalink}`}>{feeditem.o_bubble.name}</Link>
            </span>);
        }
      }
      if (feeditem.name === 'albums.create') {
        typeMessage = (<span>
          created a new album&nbsp;
          <Link key={randomKey} to={`/gallery/album/${feedObj.id}`}>{feedObj.name}</Link>
          &nbsp;in your gallery
        </span>);
      }
      if (feeditem.name === 'galleries.create_album') {
        if (feeditem.bubble) {
          typeMessage = (<span>
            added a new album&nbsp;
            <Link
              key={randomKey}
              to={`/bubbles/${feeditem.bubble.permalink}/gallery/album/${feedObj.id}`}
            >
              {feedObj.name}
            </Link>
            &nbsp;to bubble&nbsp;
            <Link to={`/bubbles/${feeditem.bubble.permalink}/gallery/`}>
              {feeditem.bubble.name}
            </Link>
            &nbsp;gallery
          </span>);
        }
        else if (feeditem.o_bubble) {
          typeMessage = (<span>
            added a new album&nbsp;
            <Link
              key={randomKey}
              to={`/bubbles/${feeditem.o_bubble.permalink}/gallery/album/${feedObj.id}`}
            >
              {feedObj.name}
            </Link>
            &nbsp;to bubble&nbsp;
            <Link to={`/bubbles/${feeditem.bubble.permalink}/gallery`}>
              {feeditem.o_bubble.name}
            </Link>
            &nbsp;gallery
          </span>);
        }
        else {
          typeMessage = <span>added a new album to bubble gallery</span>;
        }
      }
      if (feeditem.name === 'albums.create') {
        typeMessage = <span>created a new album {feedObj.name}</span>;
      }
      if (feeditem.name === 'albums.create_media' || feeditem.name === 'galleries.create_media') {
        if (feeditem.bubble) {
          typeMessage = (<span>
            added to gallery in bubble&nbsp;
            <Link key={randomKey} to={`/bubbles/${feeditem.bubble.permalink}/gallery`}>
              {feeditem.bubble.name}
            </Link>
          </span>);
        }
        else if (feeditem.o_bubble) {
          typeMessage = (<span>
            added to gallery in bubble&nbsp;
            <Link key={randomKey} to={`/bubbles/${feeditem.o_bubble.permalink}/gallery`}>
              {feeditem.o_bubble.name}
            </Link>
          </span>);
        }
        else {
          typeMessage = <span>added to gallery</span>;
        }
      }
      if (feeditem.name === 'blogs.create_post' || feeditem.object_type === 'Widgets::BlogWidget::Post') {
        if (this.props.feed_location === 'bubble_feed' || this.props.feed_location === 'blog_feed') {
          typeMessage = <span>in blog</span>;
        }
        else if (feednode.bubble) {
          typeMessage = (<span>
              in bubble&nbsp;
              <Link key={randomKey} to={`/bubbles/${feeditem.bubble.permalink}/blog`}>
                {feednode.bubble.name}
              </Link>
            </span>);
        }
        else if (feednode.o_bubble) {
          typeMessage = (<span>
              in bubble&nbsp;
              <Link key={randomKey} to={`/bubbles/${feeditem.o_bubble.permalink}/blog`}>
                {feednode.o_bubble.name}
              </Link>
            </span>);
        }
        else {
          typeMessage = <span>in bubble</span>;
        }
      }
      if (feeditem.name === 'events.create') {
        if (feedObj) {
          if (this.props.feed_location === 'bubble_feed') {
            typeMessage = <span>created event <strong>{feedObj.name}</strong> in bubble</span>;
          }
          else {
            typeMessage = (<span>
              created event&nbsp;
              <strong>{feedObj.name}</strong>
              &nbsp;in bubble&nbsp;
              <Link key={randomKey} to={`/bubbles/${feeditem.bubble.permalink}/events`}>
                {feednode.bubble.name}
              </Link>
            </span>);
          }
        }
      }
    }

    const iconColor = '#cfcfcf';
    const iconButtonStyle = {
      verticalAlign: 'middle',
      lineHeight: 1,
    };

    const likesStyle = {
      padding: '0 2px',
      border: 'none',
      width: '16px',
      height: '20px',
      fontSize: '13px',
    };

    const menuItemStyle = {
      fontSize: '13px',
      padding: '0',
      lineHeight: '32px',
      minHeight: '32px',
      margin: '0',
    };

    const activeRateClass = this.rateVisible || feedObj.user_rating ? 'active' : '';

    const likeColor = feedObj.liked ? '#62db95' : '#e4e4e4';
    const activeLikedClass = feedObj.liked ? 'active' : '';

    let likers = null;
    if (feedObj.likers) {
      if (feedObj.likers.edges.length > 0) {
        const likersArr = feedObj.likers.edges;
        let likersString = '';

        for (let i = 0; i < likersArr.length; i++) {
          let username = likersArr[i].node.first_name ? likersArr[i].node.first_name : likersArr[i].node.username;
          if (likersArr[i].node.username === user.username) {
            username = 'You';
          }
          likersString = likersString + (i === 0 ? `${username}` : `, ${username}`);
        }

        const restLikers = feedObj.likers.other_likers_count > 0 ? ` and ${feedObj.likers.other_likers_count} others` : null;

        likers = (
          <div className='likers'>
            { activeLikedClass ?
              <IconActionFavoriteActive
                style={{ ...CommonStyles.iconStyle, width: 18, height: 18 }}
                color={likeColor}
              />
              :
              <IconActionFavorite
                style={{ ...CommonStyles.iconStyle, width: 18, height: 18 }}
                color='#62db95'
              />}
            {likersString}
            {restLikers}
          </div>
        );
      }
    }

    let comments = '';
    const activeCommentClass = feedObj.new_comments_count ? 'active' : '';//feedObj.showCommentsBlock || feedObj.new_comments_count ? 'active' : '';
    const activeCommentColorClass = feedObj.new_comments_count > 0 ? 'green' : '';
    const commentColor = feedObj.new_comments_count > 0 ? '#62db95' : '#e4e4e4';

    // Comments area when there is no comment
    if (!feedObj.comments
      && feeditem.object_type !== 'Event'
      && feeditem.object_type !== 'Bubble'
      ) {
      let newComments = 0;
      if (feedObj.new_comments_count > 0) {
        newComments = parseInt(feedObj.new_comments_count, 10);
        if (newComments === 1 && !feedObj.comments) {
          this.loadFirstComment(feeditem);
          return;
        }
      }
      comments = (<div id={`comments_${feeditem.id}`} className='comments'>
        {likers}
        {'No comments yet.'}
        {newComments > 0 ?
          <FlatButton
            className='load-more-posts'
            hoverColor='#aedfe4'
            style={{ width: '100%' }}
            onClick={() => this.showComments(feeditem.shared ? 'Activity' : feeditem.object_type, feeditem.shared ? feeditem.id : feeditem.object_id, false)}
          >
            Show <b>{newComments}</b> new comments
          </FlatButton>
          :
          ''
        }
        <CreateComment
          object_type={feeditem.object_type}
          object_id={feeditem.object_id}
          feed_location={this.props.feed_location}
          updateComments={this.updateComments}
          itemCommented={this.itemCommented}
        />
      </div>);
    }

    // Comments area with some comments
    if (feedObj.comments) {
      const newComments = parseInt(feedObj.new_comments_count, 10);
      comments = (<div id={`comments_${feeditem.id}`} className='comments'>
        {likers}
        {/* feedObj.total_comments > feedObj.comments.length ?
          <a
            className="load-more-posts"
            hoverColor="#aedfe4"
            style={{ width: '100%' }}
            onClick={() => this.showComments(feeditem.shared ? 'Activity' : feeditem.object_type, feeditem.shared ? feeditem.id : feeditem.object_id, false, 'prev')}
          >
            View previous comments
          </a>
          :
          null
        */}
        {
          feedObj.comments.edges.map((comment, index) => {
            return (
              <div key={comment.node.id}>
                <CommentItem
                  index={index}
                  replyIndex={-1}
                  object_type={feeditem.object_type}
                  object_id={feeditem.object_id}
                  commentnode={comment.node}
                  updateCommentAndEndEditing={this.updateCommentAndEndEditing}
                  onReply={() => this.onReplyMessage(this.props.index, index)}
                />
                {
                  comment.node.comments ?
                  comment.node.comments.edges.map((replyComment, replyIndex) => (
                    <CommentItem
                      index={index}
                      replyIndex={replyIndex}
                      key={replyComment.node.id}
                      object_type={replyComment.node.commentable_type}
                      object_id={replyComment.node.id}
                      commentnode={replyComment.node}
                      sublevel={1}
                      updateCommentAndEndEditing={this.updateCommentAndEndEditing}
                      onReply={() => this.onReplyMessage(this.props.index, index)}
                    />
                  ))
                  :
                  ''
                }
                {
                  comment.node.replyEnabled ?
                    <CreateComment
                      index={index}
                      object_type={feeditem.object_type}
                      object_id={feeditem.object_id}
                      parent_id={parseInt(comment.node.id, 10)}
                      feed_location={this.props.feed_location}
                      updateComments={this.updateReplyComments}
                      sublevel={1}
                      itemCommented={this.itemCommented}
                    />
                  :
                  null
                }
              </div>
            );
          })
        }
        {newComments > 0 ?
          <FlatButton
            className='load-more-posts'
            hoverColor='#aedfe4'
            style={{ width: '100%' }}
            onClick={() => this.showComments(feeditem.shared ? 'Activity' : feeditem.object_type, feeditem.shared ? feeditem.id : feeditem.object_id, false)}
          >
            Show <b>{newComments}</b> new comments
          </FlatButton>
          :
          ''
        }
        <CreateComment
          object_type={feeditem.object_type}
          object_id={feeditem.object_id}
          feed_location={this.props.feed_location}
          updateComments={this.updateComments}
          itemCommented={this.itemCommented}
        />
      </div>);
    }

    let username = <Link to={`/u/${feeditem.author.username}`} className='posted-name'>@{feeditem.author.username}</Link>;

    let feedContent = '';
    let feedStat = '';

    const emojiOptions = {
      convertShortnames: true,
      convertUnicode: true,
      convertAscii: true,
      styles: {
        backgroundImage: 'url(/assets/emojione.sprites.png)',
        width: '64px',
        height: '64px',
        margin: '4px',
      },
    };

    let link_preview = null;

    if (feedObj.link_preview && !feedObj.editingText) {
      const videoLinkPreview = feedObj.link_preview.url.indexOf('youtube') > 0 || feedObj.link_preview.url.indexOf('vimeo') > 0;
      let videoLink = '';
      if (videoLinkPreview) {
        videoLink = `https://www.youtube.com/embed/${feedObj.link_preview.url.replace('https://www.youtube.com/watch?v=', '')}`;
      }

      if (feedObj.link_preview.url.indexOf('dropbox.com') > -1) {
        link_preview = (<div className='attachments-links'>
          <div className='link-preview'>
            <div className='link-info'>
              {feedObj.link_preview.description}: &nbsp;
              <Link to={feedObj.link_preview.url} target='_blank' rel='noreferrer noopener'>
                {feedObj.link_preview.title}&nbsp;(Source)
              </Link>
            </div>
            <div className='image-preview'>
              {videoLinkPreview ?
                <span>
                  <iframe width='100%' height='300' src={videoLink} frameBorder='0' allowFullScreen />
                </span>
                :
                <Link key={feedObj.id} to={feedObj.link_preview.url} target='_blank' rel='noreferrer noopener'>
                  <img src={feedObj.link_preview.picture_url} role='presentation' />
                </Link>
              }
            </div>
          </div>
        </div>);
      }
      else {
        link_preview = (<div className='attachments-links'>
          <div className='link-preview'>
            <div className='link-info'>
              <div className='title'>
                <Link to={feedObj.link_preview.url} target='_blank' rel='noreferrer noopener'>
                  {feedObj.link_preview.title}&nbsp;(Source)
                </Link>
              </div>
              <div className='description'>{feedObj.link_preview.description}</div>
            </div>
            <div className='image-preview'>
              {videoLinkPreview ?
                <span>
                  <iframe width='100%' height='300' src={videoLink} frameBorder='0' allowFullScreen />
                </span>
                :
                <Link key={feedObj.id} to={feedObj.link_preview.url} target='_blank' rel='noreferrer noopener'>
                  <img src={feedObj.link_preview.picture_url} role='presentation' />
                </Link>
              }
            </div>
          </div>
        </div>);
      }
    }

    let mediaExists = false;
    let isMultipleMedia = false;
    let feedContentMultiImages = null;
    if (feedObj.media) {
      if (feedObj.media.edges.length > 0 && feedObj.media.edges[0].node.type === 'picture') {
        mediaExists = true;
      }
    }

    if (feeditem.name === 'albums.create_media' ||
      feeditem.name === 'galleries.create_media' ||
      feeditem.object_type === 'Medium' ||
      feeditem.multi_preview_media_count > 0 ||
      mediaExists) {

      isMultipleMedia = true;
      let imagesTop = [];
      const imagesBottom = [];
      const imgCount = mediaExists ? feedObj.media.edges.length : feeditem.multi_preview_media_count;
      const multiImages = mediaExists ? feedObj.media.edges : feeditem.multi_preview_media.edges;

      if (imgCount > 0) {

        // Images = 1
        if (imgCount === 1) {
          for (let i = 0; i < imgCount; i++) {
            imagesTop.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.big_url));
          }
        }
        // Images = 2
        else if (imgCount === 2) {
          for (let i = 0; i < imgCount; i++) {
            imagesTop.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.thumb_url));
          }
        }
        // Images = 3
        else if (imgCount === 3) {
          for (let i = 0; i < 1; i++) {
            imagesTop.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.landscape_url));
          }
          for (let i = 1; i < imgCount; i++) {
            imagesBottom.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.small_lscape_url));
          }
        }
        // Images = 4
        else if (imgCount === 4) {
          for (let i = 0; i < 1; i++) {
            imagesTop.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.landscape_url));
          }
          for (let i = 1; i < imgCount; i++) {
            imagesBottom.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.small_url));
          }
        }
        // Images = 5
        else if (imgCount === 5) {
          for (let i = 0; i < 2; i++) {
            imagesTop.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.thumb_url));
          }
          for (let i = 2; i < imgCount; i++) {
            imagesBottom.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.small_lscape_url));
          }
        }
        // Images > 5
        else {
          for (let i = 0; i < 2; i++) {
            imagesTop.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.thumb_url));
          }
          for (let i = 2; i < 4; i++) {
            imagesBottom.push(this.renderImage(multiImages[i].node.id, multiImages[i].node.small_lscape_url));
          }
          imagesBottom.push(
            <span className='image'>
              <div className='image-hover-back active' onClick={() => this.props.router.push('/gallery/album/' + multiImages[4].node.album_id)} />
              <img src={multiImages[4].node.small_url} role='presentation' />
              <span className='text'>
                {imgCount - 5}+
              </span>
            </span>
          );
        }
      }
      else {
        imagesTop = (<span className='image'>
          <div className='image-hover-back' onClick={() => this.handleMediaDialogOpen(feedObj.id)} />
          {/* feeditem.multi_preview_media.edges[0].big_url*/}
          <img src={feedObj.picture_url} role='presentation' />
          <span className='zoom-image'>
            <IconZoom
              color='#FFFFFF'
              style={{ position: 'absolute', top: '45%', width: 44, height: 44 }}
            />
          </span>
        </span>);
      }

      let multipleClassName = '';
      if (imgCount > 1) {
        multipleClassName = 'multiple-images';
      }
      else if (imgCount > 4) {
        multipleClassName = 'multiple-images left-right';
      }

      feedContentMultiImages = <div className='image-block feeditem full'>
          { imgCount > 0 ?
            <div className={multipleClassName}>
              <div className='first-row'>
                {imagesTop}
              </div>
              {imagesBottom.length > 0 ?
                <div className='second-row'
                  style={{ height: $(`.myb-feeds-wrapper #${feeditem.id} .left-right .first-row`).height() }}
                >
                  {imagesBottom}
                </div>
                :
                ''
              }
            </div>
            :
            <div> {imagesTop} </div>
          }
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
        </div>;
    }

    if (feeditem.name === 'albums.create'
        && feeditem.object_type === 'Album'
        && feeditem.multi_preview_media_count === 0
      ) {
      feedContent = <div className='message-content bubble-item'>
        {
          feedObj.avatar_url ?
            <Link to={`/gallery/album/${feedObj.id}`}>
              <img className='message-photo' src={ feedObj.avatar_url } role='presentation' />
            </Link>
          :
          ''
        }
        <div className='message-text'>
          <Link to={`/gallery/album/${feedObj.id}`}>{feedObj.name}</Link>
        </div>
        <div className='bubble-description'>
          {feedObj.description ? feedObj.description : 'No album description'}
        </div>
      </div>;
    }
    else if (feeditem.name === 'galleries.create_album'
      && feeditem.object_type === 'Album'
      && feeditem.multi_preview_media_count === 0) {
      feedContent = <div className='message-content bubble-item'>
        {
          feedObj.avatar_url ?
            <Link to={`/bubbles/${feeditem.bubble.permalink}/gallery/album/${feedObj.id}`}>
              <img className='message-photo' src={feedObj.avatar_url} role='presentation' />
            </Link>
          :
          ''
        }
        <div className='message-text'>
          <Link to={`/bubbles/${feeditem.bubble.permalink}/gallery/album/${feedObj.id}`}>
            {feedObj.name}
          </Link>
        </div>
        <div className='bubble-description'>
          {feedObj.description ? feedObj.description : 'No album description'}
        </div>
      </div>;
    }
    else if (feeditem.name === 'albums.create'
      && feeditem.object_type === 'Album'
      && feeditem.multi_preview_media_count === 0) {
      feedContent = <div className='message-content bubble-item'>
        {
          feedObj.avatar_url ?
            <img className='message-photo' src={feedObj.avatar_url} role='presentation' />
          :
          null
        }
        <div className='message-text'>
          {feedObj.name}
        </div>
        <div className='bubble-description'>
          {feedObj.description ? feedObj.description : 'No album description'}
        </div>
      </div>;
    }
    else if (feeditem.name === 'bubbles.create' ||
      feeditem.name === 'bubbles.upload_avatar' ||
      feeditem.object_type === 'Bubble') {
      feedContent = '';
    }
    else if (feeditem.name === 'bubbles.disjoin_user' ||
      feeditem.name === 'bubbles.join_user' ||
      feeditem.object_type === 'Bubble') {
      feedContent = '';
    }
    else if (feeditem.name === 'events.create') {
      feedContent = (<div className='message-content bubble-item'>
        {
          feedObj.avatar_url ?
            <Link key={randomKey} to={`/bubbles/${feeditem.bubble.permalink}/events`}>
              <img className='message-photo' src={feedObj.avatar_url} role='presentation' />
            </Link>
          :
          ''
        }
        <div className='message-text' style={{ paddingBottom: 0 }}>
          <Link key={randomKey} to={`/bubbles/${feeditem.bubble.permalink}/events`}>
            {feedObj.name}
          </Link>
        </div>
        <div className='bubble-description' style={{ marginLeft: 110 }}>
          <div style={{ paddingLeft: 4 }}>{feedObj.description}</div>
          <IconPlace color='#999999' style={{ width: 18, height: 18, verticalAlign: '-20%', marginRight: 4 }}/>{feedObj.address}<br/>
          <IconClock color='#999999' style={{ width: 18, height: 18, verticalAlign: '-20%', marginRight: 4 }}/>{this.formatDateTime(feedObj.start_date)}
        </div>
      </div>);
    }
    else {
      const text = this.processTextObjects(feedObj.text || '', emojiOptions, feedObj.link_preview);
      const textOriginal = feedObj.text || '';

      let video = null;
      let isPicture = false;
      let isVideoUploading = false;

      if (feedObj.media) {
        if (feedObj.media.edges.length > 0) {
          const mediaObj = feedObj.media.edges[0].node;
          video = mediaObj.type === 'video' ? mediaObj : null;
          isPicture = !!mediaObj.picture_url && (mediaObj.type === 'picture');
          isVideoUploading = !!mediaObj.recoding_job_id && mediaObj.type === 'video';
        }
      }

      const feedItemClass = 'message-content full';

      let isText = false;
      let isLink = false;
      let isEmoji = false;

      const textContent = text ? text.map((item, i) => {
        if (typeof item === 'string') {
          isText = true;
          return <span key={i} dangerouslySetInnerHTML={{ __html: item }} />;
        }
        else if (item.type === 'Link') {
          isLink = true;
          return <span key={i}>{item.element}</span>;
        }
        else {
          isEmoji = true;
          return <span key={i} className='emoji-wrapper'>{item}</span>;
        }
      }) : [];

      feedContent = (<div className={feedItemClass}>
        {text ?
          <div className={isEmoji && !(isLink && isText) ? 'message-text emoji-only' : 'message-text'}>
          {
            feedObj.editingText ?
              <div className='message-edit'>
                <InputField
                  id='editing-post-input'
                  type='edit'
                  rows={2}
                  sendByEnter
                  defaultValue={textOriginal}
                  submitMessage={this.onMessageEditDone}
                />
              </div>
            :
              <div>
                {textContent}
              </div>
          }
          </div>
          :
          null
        }

        { isMultipleMedia ?
          feedContentMultiImages
          :
          null
        }

        {
          isPicture ?
            <div className='image-block feeditem full'>
              <span className='image'>
                <div className='image-hover-back' onClick={() => this.handleMediaDialogOpen(feedObj.media.edges[0].node.id)} />
                <img src={feedObj.media.edges[0].node.picture_url} role='presentation' />
                <span className='zoom-image'>
                  <IconZoom
                    color='#FFFFFF'
                    style={{ position: 'absolute', top: '45%', width: 44, height: 44 }}
                  />
                </span>
              </span>
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
                <GalleryItem
                  likeUnlike={this.likeUnlikeFeedItem}
                  post_liked={feedObj.liked}
                  post_likes={feedObj.likes_count}
                  post_type={feeditem.shared ? 'Activity' : feeditem.object_type}
                  post_id={feeditem.shared ? feeditem.id : feeditem.object_id}
                  media_id={this.state.mediaId}
                  updateComments={this.updateComments}
                  itemCommented={this.itemCommented}
                  handleMediaDialogClose={this.handleMediaDialogClose}
                />
              </Dialog>
            </div>
          :
            null
        }

        { video ? <VideoItem video={video} isVideoUploading={isVideoUploading}/> : null }

        {link_preview}
      </div>);
      let rateColor = '#e4e4e4';
      let rateColorText = '#8a8a8a';
      const muiSliderTheme = getMuiTheme({
        slider: {
          trackColor: rateColor,
          selectionColor: rateColor,
        },
      });
      const { draggingSlider, rateSliderValue } = this.state;
      const showingRating = draggingSlider ? rateSliderValue : feedObj.rating;
      if (showingRating) {
        rateColor = showingRating > 0 ? '#62db95' : '#f06363';
        rateColorText = rateColor;
      }
      // Feed stats like rating, likes, comment count, etc
      feedStat = <div className='message-stats'>
        <a href='javascript:void(0)' className={`stat rating-slider ${activeRateClass}`} onClick={this.toggleRater}>
          {activeRateClass ? <IconToggleStarActive style={CommonStyles.iconStyle} color={rateColor} /> : <IconToggleStar style={CommonStyles.iconStyle} color={rateColor} />}
          <span style={{ color: rateColor }}>
            {showingRating}
          </span>
        </a>
        {
          feedObj.rateVisible && this.props.ratable && feeditem.author.id !== user.id ?
          (<span className='note-rate' style={{ margin: '0 20px 0 0', display: 'inline-block', width: 100 }} onClick={(e) => e.stopPropagation()}>
            <MuiThemeProvider muiTheme={muiSliderTheme}>
              <Slider
                ref='rateSlider'
                min={-10}
                max={10}
                step={1}
                defaultValue={feedObj.user_rating}
                sliderStyle={{ top: 3, marginTop: 0, marginBottom: 0 }}
                onDragStart={this.onRateChangeStart}
                onDragStop={this.onRateChange}
                onChange={this.onRateSliding}
              />
            </MuiThemeProvider>
          </span>)
          :
          ''
        }
        <a
          href='javascript:void(0)'
          className={`stat ${activeLikedClass}`}
          onClick={() => this.likeUnlikeFeedItem(feeditem.object_type, feeditem.object_id, feedObj.liked)}
          onMouseEnter={() => setTimeout(this.setState({ openLikers: false }), 200)}
          onMouseLeave={() => setTimeout(this.setState({ openLikers: false }), 1000)}
        >
          {activeLikedClass ?
            <IconActionFavoriteActive
              style={{ width: 22, height: 22, ...CommonStyles.iconStyle, marginRight: 0 }}
              color={likeColor}
            />
            :
            <IconActionFavorite
              style={{ width: 22, height: 22, ...CommonStyles.iconStyle, marginRight: 0 }}
              color={likeColor}
            />}
          {
            feedObj.likers ?
              (feedObj.likers.edges.length > 0 ?
                <IconMenu
                   className={`likers-list ${this.state.openLikers ? 'active' : null}`}
                   iconButtonElement={
                     <IconButton touch iconStyle={{ color: '#8a8a8a' }} style={likesStyle}>
                       <span className='likes-amount'>
                         {feedObj.likes_count}
                       </span>
                     </IconButton>
                  }
                  anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                  targetOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                  menuStyle={{ backgroundColor: '#333333' }}
                  open={this.state.openLikers}
                  onRequestChange={(open, reason) => !open ? this.setState({ openLikers: false }) : null}
                >
                  {
                    feedObj.likers.edges.map((liker, index) => (
                      <MenuItem key={index} primaryText={liker.node.first_name ? liker.node.first_name : liker.node.username} style={{ fontSize: 12, minHeight: '24px', lineHeight: '24px', color: '#FFFFFF' }} />
                    ))
                  }
                </IconMenu>
              :
                <span className='likes-amount'>
                  {feedObj.likes_count}
                </span>
              )
            :
              <span className='likes-amount'>
                {feedObj.likes_count}
              </span>
          }
        </a>
        <span className='stat'>
          <IconImageRemoveRedEye style={CommonStyles.iconStyle} color='#e4e4e4'/>
          {feedObj.visits_count}
        </span>
        <a
          href='javascript:void(0)'
          className={`stat ${activeCommentClass} ${activeCommentColorClass}`}
        >
          <IconCommunicationChatBubble style={{ width: 22, height: 22, ...CommonStyles.iconStyle }} color={commentColor} />
          {feedObj.comments_count}
        </a>
      </div>;
    }

    let sharedMessage = '';
    let postedTime = '';
    let feedAvatarUrl = this.state[`user_avatar_${feeditem.author.username}`] ?
        this.state[`user_avatar_${feeditem.author.username}`]
      :
        feeditem.author.avatar_url;
    if (feeditem.shared) {
      if (this.props.feed_location === 'my_feed') {
        sharedMessage = <div className='post-shared'>You shared this:</div>;
      }
      else {
        sharedMessage = (<div className='post-shared'>
          <Link to={`/u/${feeditem.author.username}`}>
            @{feeditem.author.username}
          </Link> shared this:
        </div>);
      }
      let author = feeditem.author;
      if (feedObj.author) {
        author = feedObj.author;
      }
      if (feeditem.originalAuthor) {
        author = feeditem.originalAuthor;
      }
      feedAvatarUrl = this.state[`user_avatar_${feeditem.author.username}`] ?
          this.state[`user_avatar_${feeditem.author.username}`]
        :
          author.avatar_url;
      username = (<Link key={author.id} to={`/u/${author.username}`} className='posted-name'>
        @{author.username}
      </Link>);
      postedTime = typeMessage ?
      <div className='posted-time'>{typeMessage}&nbsp;·&nbsp;<BTimeAgo createdAt={feeditem.created_at}/></div>
      :
      <div className='posted-time'><BTimeAgo createdAt={feeditem.created_at}/></div>;
    }
    else {
      postedTime = typeMessage ?
      <div className='posted-time'>{typeMessage}&nbsp;·&nbsp;<BTimeAgo createdAt={feeditem.created_at}/></div>
      :
      <div className='posted-time'><BTimeAgo createdAt={feeditem.created_at}/></div>;
    }

    return (
      <LazyLoad offset={200} height={200} once>
        <div
          className={this.props.index === 0 ? 'myb-message first' : 'myb-message'}
          key={feeditem.id}
          id={feeditem.id}
          onClick={(e) => {
            const rateVisible = this.getStatus().rateVisible;
            if (rateVisible) {
              this.changeStatus({
                rateVisible: false,
              });
            }
          }}
        >
          <div
            className='message-inner'
          >
            {sharedMessage}
            <div className='poster'>
              <div className='user-avatar feed-user-avatar'>
                <img src={feedAvatarUrl} role='presentation' />
              </div>
              <div className='poster-info'>
                {username}
                {postedTime}
              </div>
            </div>
            <div className='post-options'>
              <IconMenu
                iconButtonElement={
                  <IconButton touch iconStyle={{ color: iconColor }} style={iconButtonStyle}>
                    <IconMoreVert />
                  </IconButton>
                }
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                menuStyle={{ width: 100 }}
              >
                {
                  (
                    this.props.feed_location === 'my_feed' ||
                    this.props.feed_location === 'bubble_feed' ||
                    this.props.feed_location === 'blog_feed'
                  )
                  &&
                  (
                    this.props.feednode.name === 'blogs.create_post' ||
                    this.props.feednode.name === 'notes.create'
                  )
                  &&
                  (this.props.feednode.author.username === user.username) ?
                    <MenuItem
                      key='1'
                      className='post-options-item'
                      style={menuItemStyle}
                      primaryText='Edit'
                      onClick={this.onEdit}
                    />
                  :
                    ''
                }
                {
                  this.props.feed_location !== 'my_feed' && !this.props.noshare ?
                    <MenuItem
                      className='post-options-item'
                      style={menuItemStyle}
                      primaryText='Share'
                      onClick={this.onShare}
                    />
                  :
                    ''
                }
                <MenuItem
                  key='2'
                  className='post-options-item'
                  style={menuItemStyle}
                  primaryText='Hide'
                  onClick={this.onHide}
                />
                {
                  (
                    this.props.feed_location === 'my_feed' ||
                    this.props.feed_location === 'bubble_feed' ||
                    this.props.feed_location === 'blog_feed' ||
                    this.props.feed_location === 'activity'
                  )
                  &&
                  (
                    this.props.feednode.name === 'blogs.create_post' ||
                    this.props.feednode.name === 'notes.create'
                  )
                  &&
                  (this.props.feednode.author.username === user.username || this.props.admin) ?
                    <MenuItem
                      key='3'
                      className='post-options-item'
                      style={menuItemStyle}
                      primaryText='Remove'
                      onClick={this.onRemove}
                    />
                  :
                    ''
                }
              </IconMenu>
            </div>

            {feedContent}

            {feedStat}

          </div>

          { comments }

        </div>
      </LazyLoad>
    );
  }
}

FeedItem.propTypes = {
  mutate: React.PropTypes.func,
  mutations: React.PropTypes.object,
  query: React.PropTypes.func,
  feed_location: React.PropTypes.string,
  feednode: React.PropTypes.object,
  noshare: React.PropTypes.bool,
  admin: React.PropTypes.bool,
  index: React.PropTypes.number,
  updateFeedStatus: React.PropTypes.func,
  updateNoteAndEndEditing: React.PropTypes.func,
  enableReply: React.PropTypes.func,
  ratable: React.PropTypes.bool,
  editable: React.PropTypes.bool,
};

export default withApollo(hoc(FeedItem));
