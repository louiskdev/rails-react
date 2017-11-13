/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';
import IconZoom from 'material-ui/svg-icons/action/zoom-in';
import { emojify } from 'react-emojione2';
import Dialog from 'material-ui/Dialog';
import CommonStyles from '@utils/CommonStyles';
import GalleryItem from '@common/GalleryItem';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import InputField from '@common/InputField';
import BTimeAgo from '@common/BTimeAgo';
import VideoItem from '@common/VideoItem';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

class CommentItem extends Component {
  static contextTypes = {
    pusher: React.PropTypes.object,
    globalChannel: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      liked: this.props.commentnode.liked,
      likes_count: this.props.commentnode.likes_count,
      openShowMedia: false,
      editingText: false,
    };
  }
  componentWillMount = () => {
    this.listenPusher();
  }

  componentWillUnmount = () => {
    this.unlistenPusher();
  }

  listenPusher = () => {
    const globalChannel = this.context.globalChannel;
    globalChannel.bind('likes_count_changed', this.handleLikesCountChanged);
  }

  unlistenPusher = () => {
    const globalChannel = this.context.globalChannel;
    globalChannel.unbind('likes_count_changed', this.handleLikesCountChanged);
  }

  handleLikesCountChanged = (data) => {
    const self = this;
    const obj = this.props.commentnode;
    if (obj) {
      if (data.message.object_id === parseInt(obj.id, 10) && data.message.object_type === 'Comment') {
        this.setState({
          likes_count: data.message.likes_count,
        });
      }
    }
  }

  handleMediaDialogOpen = (mediaId) => {
    this.setState({
      media_id: mediaId,
      openShowMedia: true,
    });
  }

  handleMediaDialogClose = () => {
    this.setState({
      media_id: null,
      openShowMedia: false,
    });
  }

  likeUnlikeCommentItem = (object_type, object_id, liked) => {
    const self = this;
    const object_id_Int = parseInt(object_id, 10);

    let likeMutation = gql`
      mutation LikeCommentitem($object_type: String!, $object_id: Int!) {
        createLike(input: {
          object_type: $object_type,
          object_id: $object_id
        }) {
          object {
            liked
            likes_count
          }
        }
      }
    `;

    if (liked) {
      likeMutation = gql`
        mutation LikeCommentitem($object_type: String!, $object_id: Int!) {
          destroyLike(input: {
            object_type: $object_type,
            object_id: $object_id
          }) {
            object {
              liked
              likes_count
            }
          }
        }
      `;
    }

    const likes_count = liked ? self.state.likes_count - 1 : self.state.likes_count + 1;

    self.setState({
      liked: !self.state.liked,
      likes_count: likes_count,
    });
    const variables = {
      object_type: object_type,
      object_id: object_id_Int,
    };

    if (object_id_Int) {
      this.props.client.mutate({
        mutation: likeMutation,
        variables: variables,
      }).then((graphQLResult) => {
        const { errors, data } = graphQLResult;

        if (errors) {
          notify.show(errors[0].message, 'error');
        }
        else {
          const likes_count = data.createLike ? data.createLike.object.likes_count : data.destroyLike.object.likes_count;
          const liked = data.createLike ? data.createLike.object.liked : data.destroyLike.object.liked;

          if (liked !== self.state.liked) {
            self.setState({
              liked: liked,
              likes_count: likes_count,
            });
          }
        }
      }).catch((error) => {
        notify.show(error.message, 'error');
      });
    }
  }

  onRemove = () => {
    const commentId = this.props.commentnode.id;

    this.props.deleteComment({ variables: { id: parseInt(commentId) } })
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
      /*else {
        this.props.onCommentItemRemoved(this.props.index, this.props.replyIndex);
      }*/
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  onEdit = () => {
    this.setState({
      editingText: true,
    });
  }

  onMessageEditDone = (vars) => {
    this.setState({
      editingText: false,
    });

    const commentId = parseInt(this.props.commentnode.id, 10);
    // optimistic UI
    // this.props.updateCommentAndEndEditing(this.props.index, vars);

    this.props.updateComment({ variables: { ...vars, id: commentId } })
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
        this.props.updateCommentAndEndEditing(this.props.index, this.props.replyIndex, vars);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
    });
  }

  onEditKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.onMessageEditDone();
    }
    else if (e.keyCode === 27) {
      this.setState({
        editingText: false,
      });
    }
  }


  processTextObjects = (rawText, emojiOptions, link_preview) => {
    let text = emojify(rawText
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>'),
       emojiOptions
    );

    if (text) {
      /* Process mentions */
      const textBefore = text;
      const usernameRegExp = /@([a-zA-Z0-9\_]+)/;
      text = [];
      textBefore.map((item, index) => {
        if (typeof item === 'string') {
          let item1 = item;
          let match = null;
          while (match = usernameRegExp.exec(item1)) {
            const foundMention = match[0];
            const username = match[1];
            const foundPos = match.index;
            if (foundPos > 0) {
              text.push(item1.substr(0, foundPos));
            }
            if (username.length > 0) {
              text.push({
                type: 'Link',
                element: <Link to={`/u/${username}`}>@{username}</Link>,
              });
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

  render() {
    const commentitem = this.props.commentnode || {};

    const iconStyle = {
      color: '#e4e4e4',
      verticalAlign: '-25%',
      marginRight: 5,
    };
    const iconColor = '#cfcfcf';
    const iconButtonStyle = {
      verticalAlign: 'middle',
      lineHeight: 1,
    };
    const likeColor = this.state.liked ? '#62db95' : '#e4e4e4';
    const activeLikedClass = this.state.liked ? 'active' : '';
    const paddingLeft = this.props.sublevel ? this.props.sublevel * 20 : 0;

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
    if (commentitem.link_preview) {
      const videoLinkPreview = commentitem.link_preview.url.indexOf('youtube') > 0 || commentitem.link_preview.url.indexOf('vimeo') > 0;
      let videoLink = '';
      if (videoLinkPreview) {
        videoLink = `https://www.youtube.com/embed/${commentitem.link_preview.url.replace('https://www.youtube.com/watch?v=', '')}`;
      }

      link_preview = <div className='attachments-links'>
        <div className='link-preview'>
          <div className='link-info'>
            <div className='title'>
              <Link to={commentitem.link_preview.url} target='_blank' rel='noreferrer noopener'>
                {commentitem.link_preview.title}
              </Link>
            </div>
            <div className='description'>{commentitem.link_preview.description}</div>
          </div>
          <div className='image-preview'>
            {videoLinkPreview ?
              <span>
                <iframe width='100%' height='300' src={videoLink} frameBorder='0' allowFullScreen />
              </span>
              :
              <Link key={commentitem.id} to={commentitem.link_preview.url} target='_blank' rel='noreferrer noopener'>
                <img src={commentitem.link_preview.picture_url} role='presentation' />
              </Link>
            }
          </div>
        </div>
      </div>;
    }

    const text = this.processTextObjects(commentitem.text || '', emojiOptions, commentitem.link_preview);
    let video = null;
    let isPicture = false;
    let isVideoUploading = false;

    if (commentitem.medium) {
      video = commentitem.medium.type === 'video' ? commentitem.medium : null;
      isPicture = !!commentitem.medium.picture_url && (commentitem.medium.type === 'picture');
      isVideoUploading = !!commentitem.recoding_job_id && commentitem.medium.type === 'video';
    }

    const textOriginal = text || '';

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

    const feed_content = <div className={text ? 'message-content' : 'message-content full'}>

      {text ?
        <div className={isEmoji && !(isLink && isText) ? 'message-text emoji-only' : 'message-text'}>
        {
          this.state.editingText ?
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

      {
        isPicture ? <div className={text ? 'image-block' : 'image-block'}>
          <span className='image'>
            <div className='image-hover-back' onClick={this.handleMediaDialogOpen.bind(this, commentitem.medium.id)} />
            <img src={commentitem.medium.picture_url} />
            <span className='zoom-image'><IconZoom color='#FFFFFF' style={{ position: 'absolute', top: '45%', width: 44, height: 44 }} /></span>
          </span>
        <Dialog
          className='gallery-media-preview'
          modal={false}
          open={this.state.openShowMedia}
          onRequestClose={this.handleMediaDialogClose}
          autoDetectWindowHeight
          autoScrollBodyContent={false}
          contentStyle={ CommonStyles.dialog.gallery_content }
          bodyStyle={ CommonStyles.dialog.body }
          style={ CommonStyles.dialog.root }
          repositionOnUpdate={ false }
        >
          <GalleryItem media_id={commentitem.medium.id} />
        </Dialog>
        </div>
        :
        ''
      }

      { video ? <VideoItem video={video} isVideoUploading={isVideoUploading}/> : null }

      {link_preview}
    </div>;

    const menuItemStyle = {
      fontSize: '13px',
      padding: '0',
      lineHeight: '32px',
      minHeight: '32px',
      margin: '0',
    };
    const user = JSON.parse(localStorage.getItem('mbubblz_user'));

    return (
      <div className='myb-message' style={paddingLeft > 0 ? { paddingLeft: paddingLeft } : {}}>
        <div className='poster'>
          <div className='user-avatar'>
            <img src={commentitem.author.avatar_url} />
          </div>
          <div className='poster-info'>
            <span className='posted-name'><Link to={'/u/' + commentitem.author.username}>{commentitem.author.username}</Link></span>
            {feed_content}
            <div className='message-stats'>
              <a className='like' onClick={this.likeUnlikeCommentItem.bind(this, 'Comment', commentitem.id, this.state.liked)}>
                {this.state.liked ? 'Unlike' : 'Like'}
              </a>
              ·
              <a id={'action reply_' + commentitem.id} className='reply' onClick={this.props.onReply}>
                Reply
              </a>
              ·
              <span className={'action like-action ' + activeLikedClass}>
                <IconActionFavorite style={{ width: 18, height: 18, ...iconStyle }} color={likeColor} />{this.state.likes_count}
              </span>
              ·
              <span className='action posted-time'>
                <BTimeAgo createdAt={commentitem.created_at}/>
              </span>
            </div>
          </div>
          {commentitem.author.username === user.username ?
            <div className='comment-options'>
              <IconMenu
                iconButtonElement={
                  <IconButton touch iconStyle={{ color: iconColor }} style={iconButtonStyle}>
                    <NavigationExpandMoreIcon />
                  </IconButton>
                }
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                menuStyle={{ width: 100 }}
              >
                <MenuItem
                  key='1'
                  className='post-options-item'
                  style={menuItemStyle}
                  primaryText='Edit'
                  onClick={this.onEdit}
                />
                <MenuItem
                  key='3'
                  className='post-options-item'
                  style={menuItemStyle}
                  primaryText='Remove'
                  onClick={this.onRemove}
                />
              </IconMenu>
            </div>
            :
            null
          }
        </div>
      </div>
    );
  }
}

export default withApollo(hoc(CommentItem));
