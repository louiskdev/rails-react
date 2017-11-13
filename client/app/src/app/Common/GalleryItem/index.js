/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import IconMoreHoriz from 'material-ui/svg-icons/navigation/more-horiz';
import MenuItem from 'material-ui/MenuItem';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';
import IconImageRemoveRedEye from 'material-ui/svg-icons/image/remove-red-eye';
import IconArrowLeft from 'material-ui/svg-icons/hardware/keyboard-arrow-left';
import IconArrowRight from 'material-ui/svg-icons/hardware/keyboard-arrow-right';
import ReactGA from 'react-ga';
import FlatButton from 'material-ui/FlatButton';
import CommentItem from '@common/CommentItem';
import CreateComment from '@common/CreateComment';
import VideoItem from '@common/VideoItem';
import CommonStyles from '@utils/CommonStyles';
import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

class GalleryItem extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
    globalChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      media_item: null,
      imgWidth: '100%',
      imgHeight: 'auto',
      itemCommented: false,
      loadingComments: false,
    };
    this.shouldScrollToBottom = false;
  }

  componentWillMount = () => {
    this.shouldScrollToBottom = true;
    this.listenPusher();
  }

  componentDidMount() {
    window.addEventListener('resize', this.setImgSizes);
    setTimeout(() => {
      this.setImgSizes();
    }, 750);
  }

  componentDidUpdate() {
    if (this.shouldScrollToBottom) {
      this.shouldScrollToBottom = false;
      if (this.refs.commentsContainer) {
        setTimeout(() => {
          const commentsContainer = this.refs.commentsContainer;
          this.scrollTo(commentsContainer, commentsContainer.scrollHeight, 150);
        }, 200);
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setImgSizes);
    this.unlistenPusher();
  }

  listenPusher = () => {
    const globalChannel = this.context.globalChannel;
    globalChannel.bind('likes_count_changed', this.handleLikesCountChanged);
    globalChannel.bind('Medium_visits_count_changed', this.handleMediumVisitsCountChanged);
    globalChannel.bind('comments_count_changed', this.handleCommentsCountChanged);
  }

  unlistenPusher = () => {
    const globalChannel = this.context.globalChannel;
    globalChannel.unbind('likes_count_changed', this.handleLikesCountChanged);
    globalChannel.unbind('Medium_visits_count_changed', this.handleMediumVisitsCountChanged);
    globalChannel.unbind('comments_count_changed', this.handleCommentsCountChanged);
  }

  handleLikesCountChanged = (data) => {
    const self = this;
    const obj = this.getStatus();
    if (data.message.object_id === parseInt(obj.id, 10)) {
      // liked should change only when initiator is current user
      const user = JSON.parse(localStorage.getItem('mbubblz_user'));
      let liked = obj.liked;
      if (data.message.user.id == user.id) {
        liked = (data.message.type != 'unliked');
      }
      self.changeStatus({
        liked,
        likes_count: data.message.likes_count,
      });
    }
  }

  handleMediumVisitsCountChanged = (data) => {
    setTimeout(() => {
      const obj = this.state.media_item ? this.state.media_item : this.props.data.medium;
      if (data.message.object_id === parseInt(obj.id, 10)) {
        this.changeStatus({
          visits_count: data.message.visits_count,
        });
      }
    }, 1000)
  }

  handleCommentsCountChanged = (data) => {
    const self = this;
    const obj = self.getStatus();
    const objId = this.props.post_id ? parseInt(this.props.post_id) : parseInt(obj.id);
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    if (obj) {
      if (data.message.object_id === parseInt(objId, 10)) {
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

  scrollTo = (element, to, duration) => {
    // if (duration <= 0) return;
    // var difference = to - element.scrollTop;
    // var perTick = difference / duration * 10;

    // setTimeout(() => {
    //   element.scrollTop = element.scrollTop + perTick;
    //   if (element.scrollTop >= to - 5) return;
    //   this.scrollTo(element, to, duration - 10);
    // }, 10);
    element.scrollTop = to;
  }

  setImgSizes = () => {
    const imgHeight = parseInt($('.gallery-media-preview .myb-message .message-inner img').height());
    const contentHeight = parseInt($('.gallery-media-preview .myb-message').parent().css('max-height').replace('px', ''));
    const windowHeight = parseInt($(window.top).height());
    const maxWidth = 'auto';
    let maxImgHeight = contentHeight;
    const maxContentHeight = contentHeight;

    if ((imgHeight - contentHeight) < -10) {
      maxImgHeight = 'auto';
    }
    this.setState({
      windowHeight: windowHeight,
      imgWidth: maxWidth,
      imgHeight: maxImgHeight,
      contentHeight: maxContentHeight,
    });
  }

  likeUnlikemediaitem = (object_type, object_id, liked) => {
    const self = this;

    let likeMutation = gql`
      mutation Likemediaitem($object_type: String!, $object_id: Int!) {
        createLike(input: {
          object_type: $object_type,
          object_id: $object_id
        }) {
          object {
            ... on Medium {
              author {
                username
              }
              comments_count
              id
              liked
              likes_count
              picture_url
              recoding_job_id
              type
              user_id
              video_links
              visits_count
            }
          }
        }
      }
    `;
    if (liked) {
      likeMutation = gql`
        mutation Likemediaitem($object_type: String!, $object_id: Int!) {
          destroyLike(input: {
            object_type: $object_type,
            object_id: $object_id
          }) {
            object {
              ... on Medium {
                author {
                  username
                }
                comments_count
                id
                liked
                likes_count
                picture_url
                recoding_job_id
                type
                user_id
                video_links
                visits_count
              }
            }
          }
        }
      `;
    }

    const likes_count = liked ? self.getStatus().likes_count - 1 : self.getStatus().likes_count + 1;

    self.changeStatus({
      liked: !self.getStatus().liked,
      likes_count: likes_count,
    });

    this.props.client.mutate({
      mutation: likeMutation,
      variables: {
        object_type: object_type,
        object_id: parseInt(object_id),
      },
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {

        const likes_count = data.createLike ? data.createLike.object.likes_count : data.destroyLike.object.likes_count;
        const liked = data.createLike ? data.createLike.object.liked : data.destroyLike.object.liked;

        if (liked !== self.getStatus().liked) {
          self.changeStatus({
            liked: liked,
            likes_count: likes_count,
          });
        }

        if (liked) {
          ReactGA.event({
            category: 'Gallery',
            action: 'Liked a gallery item',
          });
        }
        else {
          ReactGA.event({
            category: 'Gallery',
            action: 'Unliked a gallery item',
          });
        }
      }

    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  showComments = (object_type, object_id, hideComments) => {
    const self = this;
    if (!hideComments || (!this.getStatus().comments || this.getStatus().comments.length === 0)) {
      this.setState({
        loadingComments: true,
      });
      this.shouldScrollToBottom = true;
      this.props.client.query({
        query: gql`
          query getComments($last: Int!, $object_type: String!, $object_id: Int!) {
            rootCommentsForObject(
              last: $last,
              object_type: $object_type,
              object_id: $object_id
            ) {
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
                }
              }
              total_count
            }
          }
        `,
        variables: {
          last: 10,
          object_type: object_type,
          object_id: parseInt(object_id),
        },
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
              comments: data.rootCommentsForObject.edges,
              //showCommentsBlock: true,
            });
          }
          else {
            self.changeStatus({
              comments: data.rootCommentsForObject.edges,
              //showCommentsBlock: true,
            });
          }
          self.setState({
            itemCommented: false,
            loadingComments: false,
          });
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
    /*if (hideComments) {
      this.changeStatus({
        showCommentsBlock: !this.getStatus().showCommentsBlock,
      });
    }*/
  }

  itemCommented = () => {
    this.shouldScrollToBottom = true;
    this.setState({
      itemCommented: true,
    });
  }

  updateComments = (data) => {
    const newComments = this.getStatus().comments;

    this.shouldScrollToBottom = true;

    const newComment = {
      __typename: 'CommentEdge',
      node: data.createComment.comment,
    };

    if (!newComments) {
      return;
    }

    newComments.push(newComment);

    const user = JSON.parse(localStorage.getItem('mbubblz_user'));
    const commentsCount = parseInt(this.getStatus().comments_count, 10);
    if (newComment.node.username === user.username) {
      this.changeStatus({
        comments: newComments,
        comments_count: commentsCount,
        new_comments_count: 0,
      });
    }
    else {
      this.changeStatus({
        comments: newComments,
        comments_count: commentsCount,
      });
    }

    if (this.props.updateComments) {
      this.props.itemCommented();
      this.props.updateComments(data);
    }
  }

  updateReplyComments = (commentIndex, data) => {
    const commentsInit = this.getStatus().comments;
    const comments = JSON.parse(JSON.stringify(commentsInit));
    const newComment = {
      __typename: 'CommentEdge',
      node: data.createComment.comment,
    };
    if (comments[commentIndex]) {
      if (!comments[commentIndex].node.comments) {
        comments[commentIndex].node.comments = {
          edges: [],
        };
      }
      comments[commentIndex].node.comments.edges.push(newComment);
      this.changeStatus({
        comments: comments,
        // comments_count: parseInt(this.getStatus().comments_count) + 1
      });
    }
  }

  onReplyMessage = (mediaIndex, commentIndex) => {
    this.enableReply(mediaIndex, commentIndex);
  }

  enableReply = (feedIndex, commentIndex) => {
    const media_itemInit = this.getStatus();
    const media_item = JSON.parse(JSON.stringify(media_itemInit));

    if (media_item
      && media_item.comments
      && media_item.comments[commentIndex]) {
      media_item.comments[commentIndex].node.replyEnabled = true;
      this.setState({
        media_item: media_item,
      });
    }
  }

  changeStatus = (values) => {
    const media_itemInit = this.getStatus();
    const media_item = JSON.parse(JSON.stringify(media_itemInit));

    for (const key in values) {
      media_item[key] = values[key];
    }
    this.setState({
      media_item: media_item,
    });
  }

  getStatus = () => {
    return this.state.media_item ? this.state.media_item : this.props.data.medium;
  }

  onShare = (mediumId) => {
    this.props.shareMedium({ variables: { id: parseInt(mediumId) } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {
        notify.show('Successfully shared the medium', 'success');
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  onDelete = (mediumId) => {
    this.props.deleteMedium({ variables: { id: parseInt(mediumId) } })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        if (errors[0]) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
      }
      else {
        if (this.props.reloadGallery) {
          this.props.reloadGallery();
        }
        if (this.props.post_id && this.props.handleMediaDialogClose) {
          this.props.handleMediaDialogClose();
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  loadNextMedia = () => {
    const index = this.props.mediaIndex;
    const nextIndex = index === this.props.mediaIdArray.length - 1 ? 0 : index + 1;
    const nextMediaId = this.props.mediaIdArray[nextIndex];
    if (nextMediaId) {
      this.setState({
        media_item: null,
      });
      this.props.data.refetch({media_id: parseInt(nextMediaId, 10)});
      this.props.changeMediaId(nextMediaId, nextIndex);
    }
  }

  loadPrevMedia = () => {
    const index = this.props.mediaIndex;
    const prevIndex = index === 0 ? this.props.mediaIdArray.length - 1 : index - 1;
    const prevMediaId = this.props.mediaIdArray[prevIndex];
    if (prevMediaId) {
      this.setState({
        media_item: null,
      });
      this.props.data.refetch({media_id: parseInt(prevMediaId, 10)});
      this.props.changeMediaId(prevMediaId, prevIndex);
    }
  }

  render() {

    if (this.props.data.loading) {

      return (
        <div className="myb-message"
          style={{ height: this.state.windowHeight ? this.state.windowHeight - 128 : 280 }}
          >
          <div className="message-inner">
            <div
              className='message-content full'
              style={{
                textAlign: 'center',
                minHeight: 280,
                color: '#f1f1f1',
                paddingTop: 64,
              }}
            >
              <div className="image-block full"
                style={{
                  height: this.state.imgHeight ? this.state.imgHeight : 'auto',
                }}>
                Media loading...
              </div>
            </div>
          </div>
          <div className="media-right-bar">
            <div className="message-stats"/>
            <div/>
          </div>
        </div>
      );
    }
    else {

      const mediaitem = this.getStatus();

      // const iconColor = '#cfcfcf';
      // const iconButtonStyle = {
      //  verticalAlign: 'middle',
      //  lineHeight: 1,
      // };

      const likeColor = this.props.post_liked || mediaitem.liked ? '#62db95' : '#e4e4e4';
      const activeLikedClass = this.props.post_liked || mediaitem.liked ? 'active' : '';

      let comments = '';
      // const activeCommentClass = mediaitem.new_comments_count ? 'active' : '';
      // const commentColor = mediaitem.new_comments_count > 0 ? '#62db95' : '#e4e4e4';

      // Comments area when there is no comment
      const heightComments = this.state.windowHeight - 220;
      if (!mediaitem.comments) {
        let newComments = 0;
        if (mediaitem.new_comments_count > 0) {
          newComments = parseInt(mediaitem.new_comments_count, 10);
        }
        comments = <div>
          <div
            id={'comments_' + mediaitem.id}
            className='comments'
            style={{ height: heightComments ? heightComments : 200 }}>
            {this.state.loadingComments ? 'Loading...' : 'No comments yet.'}
          </div>
          {newComments > 0 ?
            <FlatButton
              className='load-more-posts'
              hoverColor='#aedfe4'
              style={{ width: '100%' }}
              onClick={() => this.showComments(this.props.post_type ? this.props.post_type : 'Medium', this.props.post_id ? this.props.post_id : mediaitem.id, false)}
            >
              Show <b>{newComments}</b> new comments
            </FlatButton>
            :
            ''
          }
          <CreateComment
            object_type={this.props.post_type ? this.props.post_type : 'Medium'}
            object_id={this.props.post_id ? parseInt(this.props.post_id) : parseInt(mediaitem.id)}
            location={this.props.location}
            updateComments={this.updateComments.bind(this)}
            itemCommented={this.itemCommented}
          />
        </div>;
      }

      // Comments area with some comments
      if (mediaitem.comments) {
        const newComments = parseInt(mediaitem.new_comments_count, 10);
        comments = <div>
          <div id={'comments_' + mediaitem.id} className='comments' ref='commentsContainer' style={{ height: heightComments ? heightComments : 200 }}>
            {mediaitem.comments.edges.length === 0 ?
              (this.state.loadingComments ? 'Loading...' : 'No comments yet.')
              :
            (
            mediaitem.comments.edges.map((comment, index) => {
              return (
                <div key={comment.node.id}>
                  <CommentItem
                    object_type={this.props.post_type ? this.props.post_type : 'Medium'}
                    object_id={this.props.post_id ? parseInt(this.props.post_id) : parseInt(mediaitem.id)}
                    commentnode={comment.node}
                    onReply={this.onReplyMessage.bind(this, this.props.index, index)} />
                  {
                    comment.node.comments ?
                    comment.node.comments.edges.map((replyComment, replyIndex) => (
                      <CommentItem
                        key={replyComment.node.id}
                        object_type={replyComment.node.commentable_type}
                        object_id={replyComment.node.id}
                        commentnode={replyComment.node}
                        sublevel={1}
                        onReply={this.onReplyMessage.bind(this, this.props.index, index)} />
                    ))
                    :
                    ''
                  }
                  {
                    comment.node.replyEnabled ?
                    <CreateComment
                      index={index}
                      object_type={this.props.post_type ? this.props.post_type : 'Medium'}
                      object_id={this.props.post_id ? parseInt(this.props.post_id) : parseInt(mediaitem.id)}
                      parent_id={parseInt(comment.node.id)}
                      location={this.props.location}
                      updateComments={this.updateReplyComments}
                      itemCommented={this.itemCommented}
                      sublevel={1} />
                    :
                    ''
                  }
                </div>
              );
            }))
          }
          {newComments > 0 ?
            <FlatButton
              className='load-more-posts'
              hoverColor='#aedfe4'
              style={{ width: '100%' }}
              onClick={() => this.showComments(this.props.post_type ? this.props.post_type : 'Medium', this.props.post_id ? this.props.post_id : mediaitem.id, false)}
            >
              Show <b>{newComments}</b> new comments
            </FlatButton>
            :
            ''
          }
          </div>
          <CreateComment
            object_type={this.props.post_type ? this.props.post_type : 'Medium'}
            object_id={this.props.post_id ? parseInt(this.props.post_id) : parseInt(mediaitem.id)}
            location={this.props.location}
            updateComments={this.updateComments}
            itemCommented={this.itemCommented}
          />
        </div>;
      }

      const username = (<Link to={'/u/' + mediaitem.author.username} className='posted-name'>@{mediaitem.author.username}</Link>);
      const user = JSON.parse(localStorage.getItem('mbubblz_user'));

      let media_content, media_stat = '';

      let video = null;
      let isPicture = false;
      let isVideoUploading = false;

      if (mediaitem) {
        video = mediaitem.type === 'video' ? mediaitem : null;
        isPicture = !!mediaitem.picture_url && (mediaitem.type === 'picture');
        isVideoUploading = !!mediaitem.recoding_job_id && mediaitem.type === 'video';
      }

      const iconPreviewColor = '#cfcfcf';
      const iconPreviewButtonStyle = {
        verticalAlign: 'middle',
        lineHeight: 1,
      };

      const menuItemStyle = {
        fontSize: '14px',
        lineHeight: '26px',
        padding: '4px 0',
        margin: '0',
        minHeight: '26px',
      };

      media_content = <div className='message-content full'>

        {
          isPicture ? <div className='image-block full'>
            <span className='helper' />
            <img
              src={mediaitem.picture_url}
              id='media_preview'
              ref='media_preview'
              style={{ height: this.state.imgHeight ? this.state.imgHeight : 'auto' }}
            />
          </div>
          :
          ''
        }

        { video ? <VideoItem height={this.state.imgHeight ? this.state.imgHeight : 'auto' } video={video} isVideoUploading={isVideoUploading}/> : null }

        {this.props.mediaIdArray ?
          <span>
            <a id="preview-left-arrow" onClick={this.loadPrevMedia}>
              <IconArrowLeft color="rgba(255, 255, 255, 0.5)" style={{width: 44, height: 44}} />
            </a>
            <a id="preview-right-arrow" onClick={this.loadNextMedia}>
              <IconArrowRight color="rgba(255, 255, 255, 0.5)" style={{width: 44, height: 44}} />
            </a>
          </span>
          :
          null
        }
        {this.props.canShare || (mediaitem.author.username === user.username || this.props.owner) ?
          <div className={video ? 'preview-bottom-bar video' : 'preview-bottom-bar'}>
            <div className='post-options'>
              <IconMenu
                iconButtonElement={
                  <IconButton touch iconStyle={{ color: iconPreviewColor }} style={iconPreviewButtonStyle}>
                    <IconMoreHoriz />
                  </IconButton>
                }
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                targetOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                menuStyle={{ width: 100 }}
                >
                { this.props.canShare ? <MenuItem className='post-options-item' style={menuItemStyle} primaryText='Share' onClick={this.onShare.bind(this, mediaitem.id)} /> : ''}
                {mediaitem.author.username === user.username || this.props.owner ? <MenuItem className='post-options-item' style={menuItemStyle} primaryText='Delete' onClick={this.onDelete.bind(this, mediaitem.id)} /> : ''}
              </IconMenu>
            </div>
          </div>
          :
          null
        }
      </div>;
      // media stats like rating, likes, comment count, etc
      media_stat = <div className='message-stats'>
        <div className='stats'>
          <a href='javascript:void(0)' className={'stat ' + activeLikedClass}
              onClick={this.props.likeUnlike ?
                this.props.likeUnlike.bind(
                  this,
                  this.props.post_type,
                  this.props.post_id,
                  this.props.post_liked
                )
                :
                this.likeUnlikemediaitem.bind(this, 'Medium', mediaitem.id, mediaitem.liked)
            }>
            <IconActionFavorite style={{ width: 22, height: 22, ...CommonStyles.iconStyle }} color={likeColor} />{this.props.post_likes ? this.props.post_likes : mediaitem.likes_count}
          </a>
          <span href='javascript:void(0)' className='stat'>
            <IconImageRemoveRedEye style={CommonStyles.iconStyle} />{mediaitem.visits_count}
          </span>
          {/* !<a href="javascript:void(0)" className={"stat "+activeCommentClass} onClick={this.showComments.bind(this, "Medium", mediaitem.id)}>
            <IconCommunicationChatBubble style={{ width: 22, height: 22, ...CommonStyles.iconStyle }} color={commentColor} />{mediaitem.comments_count}
          </a>*/}
        </div>
        <div className='username'>
          by {username}
        </div>
      </div>;

      return (
        <div
          className='myb-message'
          id={mediaitem.id}
          onClick={this.onMessageCardClick}
          style={{ height: this.state.windowHeight ? this.state.windowHeight - 128 : 280 }}>
          <div className='message-inner'>
            {media_content}
          </div>
          <div className='media-right-bar'>
            {media_stat}
            { comments }
          </div>

        </div>
      );
    }
  }
}

export default withApollo(hoc(GalleryItem));
