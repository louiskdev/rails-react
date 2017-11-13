import React, { Component } from 'react';
import { Link } from 'react-router';
import { emojify } from 'react-emojione2';
import IconZoom from 'material-ui/svg-icons/action/zoom-in';
import Dialog from 'material-ui/Dialog';

import { withApollo } from 'react-apollo';

import BTimeAgo from '@common/BTimeAgo';
import GalleryItem from '@common/GalleryItem';
import VideoItem from '@common/VideoItem';
import CommonStyles from '@utils/CommonStyles';

class ChatBoxItem extends Component {

  constructor(props) {
    super(props);

    this.state = {
      openShowMedia: false,
    };
  }

  handleMediaDialogOpen = (media_id) => {
    this.setState({
      media_id: media_id,
      openShowMedia: true,
    });
  }

  handleMediaDialogClose = () => {
    this.setState({
      media_id: null,
      openShowMedia: false,
    });
  }

  handleOnClickAvatar = (event) => {
    const { onClickAvatar } = this.props;
    if (onClickAvatar) {
      event.preventDefault();
      event.stopPropagation();
      const { chat } = this.props;
      onClickAvatar(event.currentTarget, chat.author);
    }
  }

  render() {
    const emoji_options = {
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
    const username = JSON.parse(localStorage.getItem('mbubblz_user')).username;

    const { chat, friendAvatar } = this.props;
    const isFriendChat = (chat.author.username !== username);
    const chatCssClass = (isFriendChat ? 'friend-message tri-right right-top' : 'my-message tri-right left-top') + ' chat-message';
    let text = chat.text || '';

    if (text) {
      text = emojify(text.replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>'), emoji_options);
    }

    if (text) {
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
              newItem = chat.link_preview ? item1 : newItem.replace(link, `<a href="${link}" class="out-link" target="_blank" rel="noreferrer noopener">${link}</a>`);
            }
          } while (match);
          // Now process urls that doesn't have protocol part
          do {
            const urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig);
            match = urlRegex.exec(item1);

            if (match !== null) {
              const link = match[0];
              item1 = item1.replace(link, '');
              newItem = chat.link_preview ? item1 : newItem.replace(link, `<a href="http://${link}" class="out-link" target="_blank" rel="noreferrer noopener">${link}</a>`);
            }
          } while (match);
        }

        return newItem;
      });
    }

    let video = null;
    let isPicture = false;
    let isVideoUploading = false;
    let link_preview = null;

    if (chat.medium) {
      video = chat.medium.type === 'video' ? chat.medium : null;
      isPicture = !!chat.medium.picture_url && (chat.medium.type === 'picture');
      isVideoUploading = !!chat.medium.recoding_job_id && chat.medium.type === 'video';
    }

    const youtubeUrlRegex = new RegExp(/http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/gi);
    const matchLink = youtubeUrlRegex.exec(chat.text);
    let videoLink = '';
    if (matchLink) {
      videoLink = 'https://www.youtube.com/embed/' + matchLink[1];
    }

    if (chat.link_preview) {

      link_preview = <div className='attachments-links'>
        <div className='link-preview'>
          <div className='image-preview'>
            <Link key={chat.id} to={chat.link_preview.url} target='_blank' rel='noreferrer noopener'><img src={chat.link_preview.picture_url} /></Link>
          </div>
          <div className='link-info'>
            <div className='title'><a href={chat.link_preview.url} target='_blank' rel='noopener noreferrer' >{chat.link_preview.title}</a></div>
            <div className='description'>{chat.link_preview.description}</div>
            <div className='url'><a href={chat.link_preview.url} target='_blank' rel='noopener noreferrer' >{chat.link_preview.url}</a></div>
          </div>
        </div>
      </div>;
    }

    let isText = false;
    let isEmoji = false;

    const textContent = text ? text.map((item, i) => {
      if (typeof item === 'string') {
        isText = true;
        return <span key={i} dangerouslySetInnerHTML={{ __html: item }} />;
      }
      else {
        isEmoji = true;
        return <span key={i} className='center-align emoji-wrapper chat-emoji'>{item}</span>;
      }
    }) : [];

    return (
      <div className={chatCssClass}>
        {isFriendChat ?
          <Link to={`/u/${chat.author.username}`}>
            <img className='friend-avatar' src={friendAvatar} onClick={this.handleOnClickAvatar} />
          </Link>
          :
          <Link to={`/u/${chat.author.username}`}>
            <img className='my-avatar' src={chat.author.avatar_url} onClick={this.handleOnClickAvatar} />
          </Link>
        }
        <div className='message-content mui--clearfix'>
          <span className={isEmoji && !isText ? 'chat-message-one emoji-only' : 'chat-message-one'}>
        {
          text ?
          <span>
            {textContent}
            {videoLink !== '' ? <iframe width='100%' height={this.props.type === 'privchat' ? '80' : '180'} src={videoLink} frameBorder='0' allowFullScreen /> : null}
          </span>
          :
          ''
        }
        {
          isPicture ?
          <span className={text ? 'image-block' : 'image-block'}>
            <span className='image'>
              <div className='image-hover-back' onClick={this.handleMediaDialogOpen.bind(this, chat.medium.id)} />
              <img className='attachment' src={chat.medium.picture_url} />
              <span className='zoom-image'>
                <IconZoom color='#FFFFFF' style={{ position: 'absolute', top: '40%', width: 36, height: 36 }} />
              </span>
            </span>
          <Dialog
            className='gallery-media-preview'
            modal={false}
            open={this.state.openShowMedia}
            onRequestClose={this.handleMediaDialogClose}
            autoDetectWindowHeight
            autoScrollBodyContent={!($(window).width() > 768)}
            contentStyle={ CommonStyles.dialog.gallery_content }
            bodyStyle={ CommonStyles.dialog.body }
            style={ CommonStyles.dialog.root }
            repositionOnUpdate={ false }
          >
            <GalleryItem media_id={this.state.media_id} />
          </Dialog>
          </span>
          :
          ''
        }
        { video ? <VideoItem video={video} isVideoUploading={isVideoUploading}/> : null }
        </span>
        {link_preview}
        <span className='time'><BTimeAgo createdAt={chat.created_at}/></span>
        </div>
      </div>
    );
  }

}

export default withApollo(ChatBoxItem);
