/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import IconAttachFile from 'material-ui/svg-icons/editor/attach-file';
import IconSocialSentimentSatisfied from 'material-ui/svg-icons/social/sentiment-satisfied';
import IconClose from 'material-ui/svg-icons/navigation/close';
import IconBrush from 'material-ui/svg-icons/image/brush';
import IconVideo from 'material-ui/svg-icons/av/play-circle-filled';
import IconSend from 'material-ui/svg-icons/content/send';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import { Form as FormsyForm } from 'formsy-react';
import EmojiPickerWrapper from '@common/EmojiPickerWrapper';
import Dropzone from 'react-dropzone';
import FlatButton from 'material-ui/FlatButton';
import request from 'superagent';
import debounce from 'lodash.debounce';
import { Circle } from 'rc-progress';
// import { Emoji } from 'emoji-mart'
import Dialog from 'material-ui/Dialog';
import Video from 'react-html5video';
import MobileDetect from 'mobile-detect';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';

import AvatarEditor from '@common/AvatarEditor';
import ContentEditable from '@common/ContentEditable';
import CommonStyles from '@utils/CommonStyles';

class InputField extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      _inputFieldValue: this.props.defaultValue ? this.props.defaultValue : '',
      privateFlag: false,
      showPicker: 'hidden',
      picture_files: [''],
      files: [],
      editableImg: '',
      editableImgIndex: null,
      link_preview: null,
      showAvatarEditor: false,
      avatarChanged: false,
      video_attach: null,
      stopLinkScrape: false,
      videoIsOpen: false,
      videoTimerId: 0,
      showButton: false,
      mentionSuggestedUsernames: [],
      mentionSuggestionIndex: 0,
    };

    this.channel = false;
    this.timeoutID = null;
  }

  componentDidMount = () => {
    const self = this;
    $(document).mouseup(function(e) {
      const container = $('.emoji-picker');
      const emoji = $('.emoji-picker .emoji-mart-emoji');
      if (emoji.is(e.target) && emoji.has(e.target).length !== 0) {
        // console.log(e.target.backgroundPosition);
      }

      if (!container.is(e.target) // if the target of the click isn't the container...
          && container.has(e.target).length === 0) // ... nor a descendant of the container
      {
        if (self.state.showPicker !== 'hidden') {
          self.setState({
            showPicker: 'hidden',
          });
        }
      }
    });
  }

  componentWillMount() {
    this.subscribeToPusher();
  }

  subscribeToPusher = () => {
    const pusher = this.context.pusher;
    const { channelName } = this.props;
    if (channelName) {
      this.channel = pusher.channels.channels[`private-messages_${channelName}`];
      if (!this.channel) {
        this.channel = pusher.subscribe(`private-messages_${channelName}`);
      }
    }
  }

  getCurrentValue = () => {
    return this.refs.message_input_field ? this.refs.message_input_field.refs.message_input_field.innerHTML : '';
  }

  openVideo = (index, event) => {
    event.preventDefault();
    this.setState({
      videoIsOpen: true,
    });
  }

  closeVideo = () => {
    this.setState({
      videoIsOpen: false,
    });
  }

  getVideoProgress = (job_id, media_id) => {
    const self = this;
    self.props.client.query({
      query: gql`
        query getProgress($job_id: String!, $media_id: Int!) {
          videoUploadingProgress(job_id: $job_id, media_id: $media_id) {
            state
            progress
            medium {
              video_links
              thumb_url
            }
          }
        }
      `,
      variables: {
        job_id: job_id,
        media_id: media_id,
      },
      forceFetch: true,
      activeCache: false,
    }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors.message, 'error', 2000);
      }
      else if (data.videoUploadingProgress.progress === 100 && data.videoUploadingProgress.state !== 'processing') {
        clearTimeout(this.timeoutID);
        this.timeoutID = null;

        if (this.state.video_attach) {
          self.setState({
            video_attach: data.videoUploadingProgress.medium,
            video_progress: 101,
          });
        }
      }
      else if (this.state.video_attach) {
        self.setState({
          video_progress: data.videoUploadingProgress.progress,
        });
        this.timeoutID = setTimeout(function() {
          self.getVideoProgress(job_id, media_id);
        }, 500);
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  onDropDropzone = (files) => {
    const self = this;

    /* if (files[0].type == 'video/HEVC/H.265' ||
        files[0].type == 'H.264' ||
        files[0].type == 'MPEG-4' ||
        files[0].type == 'Theora' ||
        files[0].type == 'VP9' ||
        files[0].type == 'VP8' ||
        files[0].type == 'VP6' ||
        files[0].type == 'WMV' ||
        files[0].type == 'WebM' ||
        files[0].type == 'FLV' ||
        files[0].type === 'wmv' ||
        files[0].type === 'wma' ||
        files[0].type === 'ogg' ||
        files[0].type === 'oga' ||
        files[0].type === 'ogv' ||
        files[0].type === 'ogx' ||
        files[0].type === '3gp' ||
        files[0].type === '3gp2' ||
        files[0].type === '3g2' ||
        files[0].type === '3gpp' ||
        files[0].type === '3gpp2' ||
        files[0].type === 'mp4' ||
        files[0].type === 'm4a' ||
        files[0].type === 'm4v' ||
        files[0].type === 'f4v' ||
        files[0].type === 'f4a' ||
        files[0].type === 'm4b' ||
        files[0].type === 'm4r' ||
        files[0].type === 'f4b' ||
        files[0].type === 'mov'
      ) {*/

    if (files[0].type.indexOf('video') === 0) {

      const req = request.post('/api/v1/media/upload_video');
      req.set('Authorization', localStorage.getItem('mbubblz_token'));
      req.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
      files.forEach((file) => {
        req.attach('video_file', file);
      });

      self.setState({
        video_attach: true,
        video_progress: 0,
      });

      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
        this.timeoutID = null;
      }

      req.end(function(err, res) {
        if (!err) {
          const video = JSON.parse(res.text).result.media;
          self.setState({
            video_id: video.id,
          });

          self.getVideoProgress(video.recoding_job_id, video.id);
        }
        else {
          notify.show(err, 'error', 2000);
        }
      });
    }
    else {
      const picture_files = [];
      files.map((file)=>{
        const reader = new FileReader();

        if (file.size / 1024 / 1024 > 10) {
          notify.show('You can upload image of max 10mb size', 'error');
          return;
        }

        reader.addEventListener('load', function() {
          picture_files.push(reader.result)
        }, false);

        if (file) {
          reader.readAsDataURL(file);
        }

      })
      this.setState({
        picture_files,
        files,
      });
    }
  }

  setNewImg = (img) => {
    const files = this.state.files;
    const picture_files = this.state.picture_files;
    const index = this.state.editableImgIndex;
    files[index].preview = img;
    picture_files[index] = img;

    this.setState({
      avatarChanged: true,
      showAvatarEditor: false,
      editableImg: '',
      editableImgIndex: null,
      files,
      picture_files,
    });
  }

  cancelNewImg = () => {
    this.setState({
      showAvatarEditor: false,
      editableImg: '',
      editableImgIndex: null,
    });
  }

  showEditor = (index) => {
    this.setState({
      showAvatarEditor: true,
      editableImg: this.state.files[index].preview,
      editableImgIndex: index,
    });
  }

  removeAttachment = (id) => {
    const files = this.state.files;
    files.splice(id, 1);
    this.setState({
      editableImg: '',
      files: files,
    });
  }

  onChange = (html) => {
    this.checkMentionSuggestion();
    this.scrapeLink();
  }

  scrapeLink = debounce(() => {
    if (this.channel) {
      this.channel.trigger('client-typing_status', { typing: true, channelName: this.props.channelName, fromUsername: this.props.fromUsername });
    }

    const self = this;

    if (!this.props.disableLinkPreview) {
      const inputText = this.getCurrentValue();
      const urlMatch = inputText.replace(/<img[^>]+\>/ig, '') || '';

      if (urlMatch.length > 4 && urlMatch.indexOf('@') === -1 && urlMatch.indexOf('..') === -1) {
        let match = '';
        // const urlRegex = new RegExp(/([a-z]+\:\/+)([^\/\s]*)([a-z0-9\-@\^=%&;\/~\+]*)[\?]?([^ \#]*)#?([^ \#]*)/ig);
        const urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig);
        match = urlRegex.exec(urlMatch);
        if (match) {
          let imageUrl = !!((match[0].indexOf('.jpg') > -1 || match[0].indexOf('.jpeg') > -1 || match[0].indexOf('.png') > -1 || match[0].indexOf('.gif') > -1));

          if (match[0].indexOf('dropbox.com') > -1) {
            imageUrl = false;
          }

          if (!imageUrl) {
            self.setState({
              stopLinkScrape: true,
            });

            const link = `http://${match[0].replace(/&nbsp/ig, '')}`;

            self.props.client.query({
              query: gql`
                query parseLinkPreview($link: String!) {
                  linkPreviewData(link: $link) {
                    url
                    title
                    description
                    picture_url
                  }
                }
              `,
              variables: {
                link: link,
              },
            }).then((graphQLResult) => {
              const { errors, data } = graphQLResult;

              if (errors) {
                notify.show(errors.message, 'error', 2000);
                self.setState({
                  stopLinkScrape: false,
                });
              }
              else {
                self.setState({
                  link_preview: data.linkPreviewData,
                });
              }
            }).catch((error) => {
              notify.show(error.message, 'error', 2000);
              self.setState({
                stopLinkScrape: false,
              });
            });
          }
        }
      }
    }
  }, 1000)

  createMessage = (data) => {
    const self = this;
    let vars = {};

    const privateFlag = this.state.privateFlag || false;
    const inputText = this.getCurrentValue();
    const text = inputText ? inputText.replace(/<img.*?colons="(.*?)"[^\>]+>/g, '$1').replace(/&amp;/gi, '&') : (this.props.defaultValue ? this.props.defaultValue : '');
    const picture_files = this.state.picture_files;
    const video_id = this.state.video_id || -1;
    const link_url = this.state.link_preview ? (this.state.link_preview.url || '') : '';
    const link_title = this.state.link_preview ? (this.state.link_preview.title || '') : '';
    const link_description = this.state.link_preview ? (this.state.link_preview.description || '') : '';
    const link_picture_url = this.state.link_preview ? (this.state.link_preview.picture_url || '') : '';

    if (!text && !picture_files && !link_url && !video_id) {
      notify.show('Type something or attach image/video!', 'error', 10000);
      return;
    }

    this.refs.message_input_field.refs.message_input_field.innerHTML = '';
    self.setState({
      _inputFieldValue: '',
      video_attach: null,
      video_progress: 0,
    });

    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }

    if (this.props.type === 'note' || this.props.type === 'edit') {
      vars = {
        private: privateFlag,
        text: text,
        picture_files: picture_files,
        video_id: video_id,
        link_url: link_url,
        link_title: link_title,
        link_description: link_description,
        link_picture_url: link_picture_url,
      };

    }
    else if (this.props.type === 'comment') {
      const object_type = this.props.object_type;
      const object_id = this.props.object_id;
      const parent_id = this.props.parent_id || -1;
      const feed_location = this.props.feed_location || '';

      vars = {
        object_type: object_type,
        object_id: object_id,
        text: text,
        location: feed_location,
        picture_files: picture_files,
        video_id: video_id,
        link_url: link_url,
        link_title: link_title,
        link_description: link_description,
        link_picture_url: link_picture_url,
        parent_id: parent_id,
        location: feed_location,
      };
    }
    else if (this.props.type === 'chat') {
      vars = {
        private: privateFlag,
        text: text,
        picture_file: picture_files[0],
        picture_filename: '',
        video_id: video_id,
        link_url: link_url,
        link_title: link_title,
        link_description: link_description,
        link_picture_url: link_picture_url,
      };
    }

    self.setState({
      editableImg: '',
      picture_files: [''],
      files: [],
      link_preview: null,
      video_attach: null,
      video_id: null,
    });

    this.props.submitMessage(vars);
  }

  togglePicker = () => {
    const css = (this.state.showPicker === 'hidden') ? 'show' : 'hidden';
    this.setState({
      showPicker: css,
    });
  }

  removeAttachmentLink = (id) => {
    this.setState({
      link_preview: null,
      stopLinkScrape: false,
    });
  }

  removeAttachmentVideo = (id) => {
    this.setState({
      video_attach: null,
      video_id: null,
      video_progress: 0,
    });
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }

  findUsers = (keyword) => {
    this.props.client.query({
      query: gql`
        query a($keyword: String!) {
          findUsersByKeyword(keyword: $keyword) {
            edges {
              node {
                id
                username
              }
            }
          }
        }
      `,
      variables: {
        keyword,
      },
    })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (!errors && data && data.findUsersByKeyword) {
        const usernames = [];
        data.findUsersByKeyword.edges.map(user => usernames.push(user.node.username));
        this.setState({
          mentionSuggestedUsernames: usernames,
        });
      }
    });
  }

  checkMentionSuggestion = () => {
    const lastHtml = this.getCurrentValue();
    if (lastHtml) {
      setTimeout(() => {
        const mentionPos = lastHtml.lastIndexOf('@');
        if (mentionPos == -1) {
          if (this.state.mentionSuggestedUsernames.length > 0) {
            this.setState({
              mentionSuggestedUsernames: [],
            });
          }
        }
        else {
          const html = lastHtml;
          const usernameRegExp = /^([a-zA-Z0-9\_]+)$/;
          const match = usernameRegExp.exec(html.substr(mentionPos + 1));
          if (!match || !match[0].length) {
            this.setState({
              mentionSuggestedUsernames: [],
            });
          }
          else {
            const mentionKeyword = match[0];
            this.findUsers(mentionKeyword);
          }
        }
      }, 50);
    }
  }

  onUsernameClick = (username) => {
    let html = this.getCurrentValue();
    const usernameRegExp = /^([a-zA-Z0-9\_]+)/;
    const mentionPos = html.lastIndexOf('@');
    const match = usernameRegExp.exec(html.substr(mentionPos + 1));
    if (match) {
      html = html.substr(0, mentionPos + 1) + username + html.substr(mentionPos + 1 + match[0].length);
      this.setState({
        _inputFieldValue: html,
        mentionSuggestedUsernames: [],
      });

      // Set cursor pos at the end of autocompleted username
      setTimeout(() => {
        const cursorPos = mentionPos + 1 + username.length;
        const sel = window.getSelection();
        const range = document.createRange();
        const htmlEl = this.refs.message_input_field.refs.message_input_field; // Html element for ContentEditable component
        const lastChild = htmlEl.childNodes[htmlEl.childNodes.length - 1]; // Child node can be text or DOM element which contains emoji
        range.setStart(lastChild, lastChild.length ? lastChild.length : 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }, 0);
    }
    else {
      this.setState({
        mentionSuggestedUsernames: [],
      });
    }
  }

  handleSuggestionClose = () => {
    this.setState({
      mentionSuggestedUsernames: [],
    });
  }

  onKeyPress = (event) => {
    if (this.props.sendByEnter && (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */)) {
      event.preventDefault();
      event.stopPropagation();
      this.createMessage();
    }
  }

  onKeyDown = (event) => {
    let { mentionSuggestedUsernames, mentionSuggestionIndex } = this.state;
    const suggestionCount = mentionSuggestedUsernames.length;
    if (suggestionCount > 0) {
      const key = event.which || event.keyCode || event.charCode;
      let moved = false;
      if (key == 13) {
        const { mentionSuggestedUsernames, mentionSuggestionIndex } = this.state;
        if (mentionSuggestedUsernames.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          this.onUsernameClick(mentionSuggestedUsernames[mentionSuggestionIndex]);
          return;
        }
      }
      else if (key == 38) {
        mentionSuggestionIndex = (mentionSuggestionIndex - 1) % suggestionCount;
        if (mentionSuggestionIndex < 0) {
          mentionSuggestionIndex = mentionSuggestionIndex + suggestionCount;
        }
        moved = true;
      }
      else if (key == 40) {
        mentionSuggestionIndex = (mentionSuggestionIndex + 1) % suggestionCount;
        moved = true;
      }
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        this.setState({
          mentionSuggestionIndex,
        });
      }
    }
  }

  onBlur = (event) => {
    if (this.props.sendByEnter && (this.props.type === 'edit')) {
      event.preventDefault();
      event.stopPropagation();
      this.createMessage();
    }
  }

  onPasteEvent = (event) => {
    const self = this;
    event.persist();
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const index in items) {
      const item = items[index];
      if (item.kind === 'file') {
        event.stopPropagation();
        event.preventDefault();
        const blob = item.getAsFile();
        const reader = new FileReader();

        reader.onload = function(event) {
          const randomName = (Math.random() * 10000) + '.' + blob.type.replace('image/', '');
          const files = [
            {
              name: randomName,
              preview: event.target.result,
              size: blob.size,
              type: blob.type,
            },
          ];
          self.setState({
            files: files,
            editableImg: files[0].preview,
          });
        };
        reader.readAsDataURL(blob);
      }
      else {
        if (!item.getAsString) {
          continue;
        }
        item.getAsString(function(text) {
          const urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig);
          const match = urlRegex.exec(text);

          if (match !== null) {
            let imageUrl = !!((
              match[0].indexOf('.jpg') > -1 ||
              match[0].indexOf('.jpeg') > -1 ||
              match[0].indexOf('.png') > -1 ||
              match[0].indexOf('.gif') > -1
            ));

            if (match[0].indexOf('dropbox.com') > -1) {
              imageUrl = false;
            }

            if (imageUrl) {
              event.stopPropagation();
              event.preventDefault();
              const randomName = (Math.random() * 10000) + '.png';
              const files = [
                {
                  name: randomName,
                  preview: 'http://' + match[0],
                  size: 0,
                  type: 'image/png',
                },
              ];
              self.setState({
                files: files,
                editableImg: files[0].preview,
              });
            }
            else {
              self.scrapeLink();
              return;
            }
          }
        });
      }
    }
    return;
  }

  onEmojiChange = (data, event) => {

    /* const emogiEm = <Emoji emoji={data.colons} native={true} set='emojione' />
    const emoji = `<span
      title="${data.colons}"
      >
      ${emogiEm}
      </span>`;*/
    const emojiPosition = event.target.style.backgroundPosition;
    const emoji = '<img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Transparent.gif" class="emoji-wrapper-box" colons="' + data.colons + '" style="background-position: ' + emojiPosition + '"/>';

    const inputText = this.getCurrentValue();
    this.setState({
      _inputFieldValue: inputText + emoji,
      //showPicker: 'hidden',
    });

    // Set cursor pos after inserted emoji (currently emojis are inserted only at the end)
    setTimeout(() => {
      const htmlEl = this.refs.message_input_field.refs.message_input_field; // Html element for ContentEditable component
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(htmlEl);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }, 0);
  }

  render() {
    const self = this;

    const iconStyle = {
      width: 22,
      height: 22,
      marginTop: 6,
      marginRight: 4,
      verticalAlign: 'middle',
    };
    const iconColor = '#bdbdbd';

    let link_preview = null;
    if (this.state.link_preview) {
      if (this.state.link_preview.url.indexOf('dropbox.com') > -1) {
        link_preview = (<div className='link-preview'>
          <div className='link-info'>
            {this.state.link_preview.description}:&nbsp;
              <Link
                to={this.state.link_preview.url}
                target='_blank'
                rel='noopener noreferrer'
              >
                {this.state.link_preview.title}
              </Link>
          </div>
          <div className='image-preview'>
            <Link
              to={this.state.link_preview.url}
              target='_blank'
              rel='noopener noreferrer'
            >
              <img src={this.state.link_preview.picture_url} role='presentation' />
            </Link>
          </div>
          <a
            className='remove-attachment'
            onClick={() => this.removeAttachmentLink()}
          >
            <IconClose style={{ width: 18, height: 18 }} />
          </a>
        </div>);
      }
      else {
        link_preview = (<div className='link-preview'>
          <div className='image-preview'>
            <Link
              to={this.state.link_preview.url}
              target='_blank'
              rel='noopener noreferrer'
            >
              <img src={this.state.link_preview.picture_url} role='presentation' />
            </Link>
          </div>
          <div className='link-info'>
            <div className='title'>
              <Link
                to={this.state.link_preview.url}
                target='_blank'
                rel='noopener noreferrer'
              >
                {this.state.link_preview.title}
              </Link>
            </div>
            <div className='description'>{this.state.link_preview.description}</div>
            <div className='url'>
              <Link
                to={this.state.link_preview.url}
                target='_blank'
                rel='noopener noreferrer'
              >
                {this.state.link_preview.url}
              </Link>
            </div>
          </div>
          <a
            className='remove-attachment'
            onClick={() => this.removeAttachmentLink()}
          >
            <IconClose style={{ width: 18, height: 18 }} />
          </a>
        </div>);
      }
    }

    let video_preview = null;
    if (this.state.video_attach) {
      video_preview = (<div className={this.state.video_progress === 101 ? 'image-preview video-preview input-preview' : 'image-preview video-preview'}>
          { this.state.video_progress === 101 ?
              <div className='video-block full'>
                <div className='image-hover-back' onClick={(e) => this.openVideo(0, e)} />
                <img src={this.state.video_attach.thumb_url} />
                <span className='zoom-image'>
                  <IconVideo
                    color='#FFFFFF'
                    style={{
                      position: 'absolute',
                      top: '25%',
                      width: 44,
                      height: 44,
                    }}
                  />
                </span>
                <Dialog
                  className='video-preview'
                  modal={false}
                  open={this.state.videoIsOpen}
                  onRequestClose={this.closeVideo}
                  autoScrollBodyContent
                  contentStyle={{ padding: 0 }}
                >
                  <Video controls loop muted poster={this.state.video_attach.thumb_url}>
                      <source src={this.state.video_attach.video_links[0]} type='video/mp4' />
                      <source src={this.state.video_attach.video_links[1]} type='video/webm' />
                      <source src={this.state.video_attach.video_links[2]} type='video/ogv' />
                  </Video>
                </Dialog>
              </div>
            :
              <span>
                <Circle percent={this.state.video_progress || 0} strokeWidth='8' strokeColor='#62db95' />
                <span
                  style={{
                    position: 'absolute',
                    left: '30%',
                    top: '33%',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                  }}
                >
                  {this.state.video_progress || 0}%
                </span>
              </span>
          }
          <a
            className='remove-attachment'
            onClick={() => this.removeAttachmentVideo()}
          >
            <IconClose style={{ width: 18, height: 18 }} />
          </a>
      </div>);
    }

    let emojiPickerCssClass = this.props.rows === 1 || (this.props.type === 'edit') ?
        `emoji-picker ${this.state.showPicker}`
      :
        `emoji-picker left ${this.state.showPicker}`;
    if (this.props.pickerPosition === 'up') {
      emojiPickerCssClass = emojiPickerCssClass + ' picker-at-top';
    }

    const inputText = this.state._inputFieldValue;

    const md = new MobileDetect(window.navigator.userAgent);
    const showButtonClass = md.phone() || md.tablet() || this.state.showButton || !this.props.sendByEnter ? 'show' : 'hidden';

    return (
      <div className={this.props.parent_id ? 'new-message-box replyComment' : (this.props.type === 'edit' ? 'new-message-box edit-post-box' : 'new-message-box')}>
        <FormsyForm
          onValidSubmit={this.createMessage}
          noValidate
          autoComplete='off'
          style={{ width: '100%' }}
        >
        { this.props.rows === 1 || this.props.type === 'edit' ?
          <div className={this.props.type === 'edit' ? 'new-message-box-group edit-post' : 'new-message-box-group'}>
            <div className='new-message-box-group-inner'>
              {this.props.type === 'edit' ? '' :
                (this.state.files.length > 0 ?
                  <div style={{ marginLeft: 0 }}>
                    <div className='photo-icon disabled'>
                      <IconAttachFile
                        color='#dddddd'
                        hoverColor='#eeeeee'
                        style={{
                          width: 22,
                          height: 22,
                          marginTop: 2,
                          marginRight: -2,
                          verticalAlign: 'middle',
                        }}
                      />
                    </div>
                  </div>
                :
                  <div style={{ marginLeft: 0 }}>
                    <Dropzone className='photo-icon' onDrop={this.onDropDropzone} multiple={true}>
                      <IconAttachFile
                        color={iconColor}
                        hoverColor='#5ed28f'
                        style={{
                          width: 22,
                          height: 22,
                          marginTop: 2,
                          marginRight: -2,
                          verticalAlign: 'middle',
                        }}
                      />
                    </Dropzone>
                  </div>
                )
              }
              <ContentEditable
                id={this.props.id || 'message_input_field'}
                placeholder='Express yourself...'
                name='text'
                ref='message_input_field'
                className='new-message-input'
                onKeyPress={this.onKeyPress}
                onKeyDown={this.onKeyDown}
                onChange={this.onChange}
                onBlur={this.onBlur}
                onPaste={this.onPasteEvent}
                html={inputText}
              />
              <div>
                <a className='emoji-picker-icon' onClick={() => this.togglePicker()}>
                  <IconSocialSentimentSatisfied color={iconColor} hoverColor='#5ed28f' style={iconStyle} />
                </a>
              </div>
              <div className={showButtonClass}>
                <FlatButton
                  label={ $(window).width() > 480 ? 'Send' : <IconSend color='#5ed28f' />}
                  primary
                  type='submit'
                  backgroundColor={ $(window).width() > 480 ? CommonStyles.outside.buttonBackgroundColor : 'transparent' }
                  hoverColor={CommonStyles.outside.buttonHoverColor}
                  labelStyle={{
                    textTransform: 'none',
                    fontSize: '13px',
                    fontWeight: 400,
                    padding: $(window).width() > 480 ? '0 16px' : 0,
                  }}
                  style={{
                    color: '#FFFFFF',
                    margin: '4px 4px 4px 8px',
                    height: 28,
                    lineHeight: '28px',
                    minWidth: $(window).width() > 480 ? 72 : 32,
                  }}
                />
              </div>
            </div>
            <div className='attachments-preview'>
              <div className='attachments-images'>
                {this.state.files.length > 0 ?
                  this.state.files.map((file, index) => <div className='image-preview' key={index}>
                    <img
                      id={index}
                      src={file.preview}
                      style={{ margin: this.state.avatarChanged ? 0 : '0 -50%' }}
                      role='presentation'
                    />
                    <a
                      className='remove-attachment'
                      onClick={() => this.removeAttachment(index)}
                    >
                      <IconClose style={{ width: 18, height: 18 }} />
                    </a>
                    <a
                      className='show-editor'
                      onClick={() => this.showEditor(index)}
                    >
                      <IconBrush style={{ width: 18, height: 18 }} />
                    </a>
                    {this.state.showAvatarEditor ?
                      <AvatarEditor previewImg={this.state.editableImg} setNewImg={this.setNewImg} cancelNewImg={this.cancelNewImg} />
                    :
                      null
                    }
                  </div>)
                  :
                  null
                }
              </div>
              <div className='attachments-images'>
                {video_preview}
              </div>
              <div className='attachments-links'>
                {link_preview}
              </div>
            </div>
          </div>
          :
          <div className='my-first-message'>
            <div className='welcome-text'>
              Type your first message in your feed.
            </div>
            <ContentEditable
              id={this.props.id || 'message_input_field'}
              placeholder='Express yourself...'
              name='text'
              ref='message_input_field'
              className='new-message-input'
              onKeyPress={this.onKeyPress}
              onKeyDown={this.onKeyDown}
              onChange={this.onChange}
              html={inputText}
            />
            <div className='message-bottom' style={{ display: 'flex' }}>
              <div style={{ flexGrow: 1, zIndex: 10 }}>
                <a>
                  <Dropzone className='photo-icon' onDrop={this.onDropDropzone} multiple={false}>
                    <IconAttachFile
                      color={iconColor}
                      hoverColor='#5ed28f'
                      style={{
                        width: 25,
                        height: 25,
                        marginTop: 0,
                        marginRight: 0,
                        verticalAlign: 'middle',
                      }}
                    />
                  </Dropzone>
                </a>
                <a className='emoji-picker-icon' onClick={() => this.togglePicker()}>
                  <IconSocialSentimentSatisfied color={iconColor} hoverColor='#5ed28f' style={iconStyle} />
                </a>
              </div>
              <div className={showButtonClass} style={{ flexGrow: 1, textAlign: 'right' }}>
                <FlatButton
                  label={ $(window).width() > 480 ? 'Send' : <IconSend />}
                  primary
                  type='submit'
                  backgroundColor='#5ed28f'
                  hoverColor='#5bc789'
                  style={{
                    color: '#FFFFFF',
                    margin: '4px',
                    height: 28,
                    lineHeight: '28px',
                    minWidth: 72,
                  }}
                />
              </div>
            </div>
            <div className='attachments-preview'>
              <div className='attachments-images'>
                {this.state.files.length > 0 ?
                  this.state.files.map((file, index) => <div className='image-preview' key={index}>
                    <img
                      id={index}
                      src={file.preview}
                      style={{ margin: this.state.avatarChanged ? 0 : '0 -50%' }}
                      role='presentation'
                    />
                    <a
                      className='remove-attachment'
                      onClick={() => this.removeAttachment(index)}
                    >
                      <IconClose style={{ width: 18, height: 18 }} />
                    </a>
                    <a
                      className='show-editor'
                      onClick={() => this.showEditor(index)}
                    >
                      <IconBrush style={{ width: 18, height: 18 }} />
                    </a>
                    {this.state.showAvatarEditor ?
                      <AvatarEditor previewImg={this.state.editableImg} setNewImg={this.setNewImg} cancelNewImg={this.cancelNewImg} />
                    :
                      null
                    }
                  </div>)
                  :
                  null
                }
              </div>
              <div className='attachments-images'>
                {video_preview}
              </div>
              <div className='attachments-links'>
                {link_preview}
              </div>
            </div>
          </div>
        }
        </FormsyForm>
        <div className={emojiPickerCssClass}>
          <EmojiPickerWrapper search onChange={this.onEmojiChange} />
        </div>

        <Popover
          open={this.state.mentionSuggestedUsernames.length > 0}
          anchorEl={this.refs.message_input_field ? this.refs.message_input_field.refs.message_input_field : null}
          anchorOrigin={this.props.pickerPosition === 'up' ? { horizontal: 'left', vertical: 'top' } : { horizontal: 'left', vertical: 'bottom' }}
          targetOrigin={this.props.pickerPosition === 'up' ? { horizontal: 'left', vertical: 'bottom' } : { horizontal: 'left', vertical: 'top' }}
          onRequestClose={this.handleSuggestionClose}
        >
          <Menu
            desktop
            disableAutoFocus
            width={240}
            >
            {
              this.state.mentionSuggestedUsernames.map((username, i) => (
                <MenuItem
                  key={i}
                  primaryText={username}
                  style={this.state.mentionSuggestionIndex == i ? { backgroundColor: 'rgba(0, 0, 0, 0.1)' } : {}}
                  onTouchTap={this.onUsernameClick.bind(this, username)} />
              ))
            }
          </Menu>
        </Popover>
      </div>
    );
  }
}

InputField.propTypes = {
  mutate: React.PropTypes.func,
  mutations: React.PropTypes.object,
  query: React.PropTypes.func,
  defaultValue: React.PropTypes.string,
  channelName: React.PropTypes.string,
  fromUsername: React.PropTypes.string,
  type: React.PropTypes.string,
  disableLinkPreview: React.PropTypes.bool,
  object_type: React.PropTypes.string,
  object_id: React.PropTypes.number,
  parent_id: React.PropTypes.number,
  feed_location: React.PropTypes.string,
  submitMessage: React.PropTypes.func,
  sendByEnter: React.PropTypes.bool,
};

export default withApollo(InputField);
