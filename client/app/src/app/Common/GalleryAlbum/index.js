/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import request from 'superagent';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import Dropzone from 'react-dropzone';
import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import IconButton from 'material-ui/IconButton';
import IconZoom from 'material-ui/svg-icons/action/zoom-in';
import IconPlay from 'material-ui/svg-icons/av/play-arrow';
import IconClose from 'material-ui/svg-icons/navigation/close';
import IconVideo from 'material-ui/svg-icons/av/play-circle-filled';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';
import IconImageRemoveRedEye from 'material-ui/svg-icons/image/remove-red-eye';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import { Form as FormsyForm } from 'formsy-react';
import Paper from 'material-ui/Paper';
import Video from 'react-html5video';
import { Circle } from 'rc-progress';
import { GridList, GridTile } from 'material-ui/GridList';
import ReactGA from 'react-ga';
import gql from 'graphql-tag';

import hoc from './hoc';
import GalleryItem from '@common/GalleryItem';
import VideoItem from '@common/VideoItem';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';

const timeoutID = null;

class GalleryAlbum extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      messagesContainerHeight: 600,
      openUploadAttachments: false,
      ignorePristine: false,
      canSubmit: false,
      isSmallScreen: $(window).width() < 600,
      isMobileScreen: $(window).width() < 767,
      files: [],
      avatar: '',
      avatar_filename: '',
      openShowMedia: false,
      media_id: null,
      mediaIndex: null,
      progressUpdating: false,
      video_progress: 0,
      video_attach: null,
      loadingState: false,
    };

  }

  componentDidMount() {
    this.subscribeToPusherChannel();
    window.addEventListener('resize', this.onWindowResize);
    setTimeout(() => {
      this.onWindowResize();
    }, 10);
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
    window.removeEventListener('resize', this.onWindowResize);
  }

  componentWillReceiveProps(nextProps) {
    this.onWindowResize();
  }

  onWindowResize = () => {
    const msgbox = ReactDOM.findDOMNode(this);
    if (msgbox) {
      const msgboxSize = msgbox.getBoundingClientRect();
      const msgHeight = $(window).width() > 480 ? window.innerHeight - msgboxSize.top : window.innerHeight - msgboxSize.top - 40;
      this.setState({
        messagesContainerHeight: msgHeight,
      });
    }
  }

  subscribeToPusherChannel = () => {
    const self = this;
    const pusher = this.context.pusher;
    let galleryChannel = pusher.channels.channels['private-gallery-widget-' + this.props.gallery_id];
    if (!galleryChannel) {
      galleryChannel = pusher.subscribe('private-gallery-widget-' + this.props.gallery_id);
    }

    galleryChannel.bind('gallery_item_added', function(data) {
      self.refetchMedia();
    }, this);

    galleryChannel.bind('gallery_item_removed', function(data) {
      self.refetchMedia();
    }, this);
  }

  unsubscribeFromPusherChannel = () => {
    const pusher = this.context.pusher;
    const galleryChannel = pusher.channels.channels['private-gallery-widget-' + this.props.gallery_id];
    if (galleryChannel) {
      galleryChannel.unbind('feed_item_added');
      galleryChannel.unbind('feed_item_removed');
      pusher.unsubscribe('private-gallery-widget-' + this.props.gallery_id);
    }
  }

  refetchMedia = () => {
    if (this.props.permalink) {
      this.props.refetchAlbumMedia();
    } else {
      this.props.data.refetch();
    }

    this.setState({
      files: [],
      loadingState: false,
    });
    this.handleDialogClose();
  }

  handleMediaDialogOpen = (media_id, index) => {
    this.setState({
      media_id,
      mediaIndex: index,
      openShowMedia: true,
    });
  }

  handleMediaDialogClose = () => {
    this.setState({
      media_id: null,
      mediaIndex: null,
      openShowMedia: false,
    });
  }

  onDropDropzone = (files) => {
    const self = this;

    for (let i = 0; i < files.length; i++) {
      if (files[i].type.indexOf('video') === 0) {

        const req = request.post('/api/v1/media/upload_video');
        if (this.props.gallery_id) {
          req.set('Authorization', localStorage.getItem('mbubblz_token'));
          req.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
          req.field('album_id', this.props.album_id);
          req.field('gallery_id', this.props.gallery_id);
        }
        else {
          req.set('Authorization', localStorage.getItem('mbubblz_token'));
          req.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
          req.field('album_id', this.props.album_id);
        }
        files.forEach((file) => {
          req.attach('video_file', file);
        });

        self.setState({
          video_attach: true,
          video_progress: 1,
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
        const file = files[i];
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
    }
    const addedFiles = this.state.files.concat(files);
    this.setState({
      files: addedFiles,
    });
  }

  handleDialogOpen = () => {
    this.setState({
      openUploadAttachments: true,
      loadingState: false,
    });
  }

  handleDialogClose = () => {
    this.setState({
      openUploadAttachments: false,
      loadingState: false,
    });
  }

  enableButton = () => {
    this.setState({
      canSubmit: true,
    });
  }

  disableButton = () => {
    this.setState({
      canSubmit: false,
    });
  }

  submitForm = (data) => {
    const self = this;

    if (this.state.files.length === 0) {
      notify.show('Select file', 'error');
      return;
    }

    this.setState({
      loadingState: true,
    });

    let upload_images = false;
    let upload_videos = false;

    const req_video = request.post('/api/v1/media/upload_videos');
    if (this.props.gallery_id) {
      req_video.set('Authorization', localStorage.getItem('mbubblz_token'));
      req_video.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
      req_video.field('album_id', this.props.album_id);
      req_video.field('gallery_id', this.props.gallery_id);
    }
    else {
      req_video.set('Authorization', localStorage.getItem('mbubblz_token'));
      req_video.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
      req_video.field('album_id', this.props.album_id);
    }

    const req_image = request.post('/api/v1/media/upload_pictures');
    if (this.props.gallery_id) {
      req_image.set('Authorization', localStorage.getItem('mbubblz_token'));
      req_image.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
      req_image.field('album_id', this.props.album_id);
      req_image.field('gallery_id', this.props.gallery_id);
    }
    else {
      req_image.set('Authorization', localStorage.getItem('mbubblz_token'));
      req_image.set('Client-ID', localStorage.getItem('mbubblz_client_id'));
      req_image.field('album_id', this.props.album_id);
    }

    this.state.files.forEach((file)=> {
      if (file.type.indexOf('video') === 0) {
        upload_videos = true;
        req_video.attach(file.name, file);
      }
      else {
        upload_images = true;
        req_image.attach(file.name, file);
      }
    });

    if (upload_images) {
      req_image.end(function(err, res) {
        if (!err) {
          self.refetchMedia();
          ReactGA.event({
            category: 'Gallery',
            action: 'Uploaded an image to album',
          });
        }
        else {
          notify.show(err, 'error', 2000);
        }
      });
    }

    if (upload_videos) {
      req_video.end(function(err, res) {
        if (!err) {
          self.refetchMedia();
          ReactGA.event({
            category: 'Gallery',
            action: 'Uploaded a video to album',
          });
        }
        else {
          notify.show(err, 'error', 2000);
        }
      });
    }

  }

  onKeyPress(event) {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */) {
      event.preventDefault();
    }
  }

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
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
        media_id: parseInt(media_id),
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

  reloadGallery = () => {
    this.handleMediaDialogClose();
    this.props.data.refetch();
  }

  changeMediaId = (media_id, mediaIndex) => {
    this.setState({
      media_id,
      mediaIndex,
    });
  }

  render() {

    const signButtonStyle = {
      height: '48px',
      width: this.state.isSmallScreen ? '85%' : 'auto',
      margin: '16px 16px 16px 24px',
      minWidth: '120px',
    };

    const signButtonLabelStyle = {
      fontSize: '1.2em',
      textTransform: 'none',
      padding: '0px 30px',
      lineHeight: '50px',
    };

    const gridStyles = {
      overflowY: 'auto',
    };

    let cols = 2;
    let cellHeight = 110;
    if ($(window).width() > 768) {
      cols = 4;
      cellHeight = 180;
    }
    if ($(window).width() > 480 && $(window).width() <= 768) {
      cols = 3;
      cellHeight = 145;
    }

    const uploadAttachment = !this.props.upload ? '' : <div className='gallery-actions'>
        {$(window).width() > 480 ?
          <FlatButton
            label='Upload'
            backgroundColor='#61D894'
            primary
            onTouchTap={this.handleDialogOpen}
            labelStyle={{ textTransform: 'capitalize', fontSize: 12 }}
            style={{ color: '#FFFFFF', lineHeight: '28px', height: '28px' }}
          />
        :
          <div style={{ position: 'fixed', zIndex: 1, right: 16, bottom: 12 }}>
            <FloatingActionButton backgroundColor='#61D894' onTouchTap={this.handleDialogOpen}>
              <span style={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}>+</span>
            </FloatingActionButton>
          </div>
        }
        <Dialog
          title='Upload attachments'
          titleStyle={{ border: 'none', padding: '14px 24px 14px' }}
          contentStyle={{ padding: 0 }}
          bodyStyle={{ padding: 0 }}
          modal={false}
          open={this.state.openUploadAttachments}
          onRequestClose={this.handleDialogClose}
          autoScrollBodyContent
        >
          <div className='complete-profile-wrapper gallery-uploads'>
            <FormsyForm
              onKeyPress={this.onKeyPress}
              onValid={this.enableButton}
              onInvalid={this.disableButton}
              onValidSubmit={this.submitForm}
              onInvalidSubmit={this.onInvalidFormSubmit}
              noValidate
            >
              <Paper style={{
                display: 'block',
                margin: 0,
                padding: '0 24px',
              }}
              zDepth={0}
              rounded={false}
              >
                <div className='uploaded-attachments'>
                {this.state.files.length > 0 ?
                  <GridList
                    cols={cols}
                    cellHeight={cellHeight}
                    padding={8}
                    className='gallery-content'
                    style={{ overflowY: 'auto', paddingBottom: '24px 24px 16px 24px' }}
                  >
                    {
                      this.state.files.map((file, index) => {
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
                                    <Circle percent={this.state.video_progress || 1} strokeWidth='8' strokeColor='#62db95' />
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

                        if (this.state.video_attach) {
                          return (<GridTile key={index} className='attachments-preview'>
                            <div className='attachments-images'>
                              {video_preview}
                            </div>
                          </GridTile>
                          );
                        }
                        else {
                          return (<GridTile key={index}>
                            <img src={file.preview} className='image-attachments-preview' />
                          </GridTile>
                          );
                        }
                      })
                    }
                  </GridList>
                  :
                  ''
                }
                </div>
                <Dropzone className='upload-attachment' onDrop={this.onDropDropzone} multiple>
                  <CloudUpload color='#DFDFDF' style={{ width: '60px', height: '60px', margin: '36px 0' }} />
                </Dropzone>
              </Paper>
              <div className='form-footer' style={{ marginTop: 16, borderTop: '1px solid rgb(224, 224, 224)' }}>
                <RaisedButton
                  backgroundColor='#61D894'
                  label={this.state.loadingState ? <div className='loader-wrapper'><div className='loader' /></div> : 'Save attachments'}
                  labelColor='#FFFFFF'
                  labelStyle={signButtonLabelStyle}
                  style={signButtonStyle}
                  type='submit'
                  disabled={!!this.state.loadingState}
                  formNoValidate
                />
              </div>
            </FormsyForm>
          </div>
        </Dialog>
      </div>;

    if (this.props.data.loading) {
      return (
        <div>
          Gallery Album loading...
        </div>
      );
    }
    else {

      const {
        ignorePristine,
        avatar_filename,
      } = this.state;

      let galleryItems = null;
      if (this.props.userGalleryAllMedia) {
        galleryItems = this.props.userGalleryAllMedia;
      }
      else if (this.props.mediaFromGallery) {
        galleryItems = this.props.mediaFromGallery;
      }
      else if (this.props.data.myGalleryAllMedia && !(this.props.username || this.props.permalink)) {
        galleryItems = this.props.data.myGalleryAllMedia;
      }

      let backLink = <Link to='/gallery'>Go back to My Albums</Link>;
      if (this.props.username) {
        backLink = <Link to={'/u/' + this.props.username + '/gallery'}>Go back to User Albums</Link>;
      }
      else if (this.props.permalink) {
        backLink = <Link to={'/bubbles/' + this.props.permalink + '/gallery'}>Go back to Bubble Albums</Link>;
      }

      let galleryLink = '/gallery';
      if (this.props.username) {
        galleryLink = '/u/' + this.props.username + '/gallery';
      }
      else if (this.props.permalink) {
        galleryLink = '/bubbles/' + this.props.permalink + '/gallery';
      }

      const iconStatStyle = {
        width: 16,
        height: 16,
        verticalAlign: '-30%',
        marginRight: 4,
      };

      if (galleryItems.edges.length > 0) {

        const images = [];
        const videos = [];
        const mediaIdArray = [];
        galleryItems.edges.map((media, index)=>{
          mediaIdArray.push(galleryItems.edges[index].node.id);
          if (media.node.type === 'video') {

            const video = media.node;
            let isVideoUploading = false;

            if (media.node) {
              isVideoUploading = !!video.recoding_job_id && media.node.type === 'video';
            }

            videos.push(
              <GridTile
                  className='album-item'
                  key={index}
                  onClick={this.handleMediaDialogOpen.bind(this, media.node.id, index)}
                  actionIcon={
                    <IconButton style={{ width: 100, fontSize: 12, color: '#fff', textAlign: 'left' }}>
                      <span>
                        <IconActionFavorite color='white' style={iconStatStyle}/>
                        <span>{media.node.likes_count}</span>
                      </span>
                      &nbsp;&nbsp;
                      <span>
                        <IconImageRemoveRedEye color='white' style={iconStatStyle}/>
                        <span>{media.node.visits_count}</span>
                      </span>
                    </IconButton>
                  }
                  actionPosition='left'
                  title='0'
                  titleStyle={{ opacity: 0 }}
                  titlePosition='bottom'
                  titleBackground='linear-gradient(to top, rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 70%,rgba(0,0,0,0) 100%)'
                >

                {video ?
                  <VideoItem isAlbum video={video} isVideoUploading={isVideoUploading}/>
                  :
                  null
                }

              </GridTile>
            );
          }
          else {
            images.push(
              <GridTile
                  className='album-item'
                  key={index}
                  onClick={this.handleMediaDialogOpen.bind(this, media.node.id, index)}
                  actionIcon={
                    <IconButton style={{ width: 100, fontSize: 12, color: '#fff', textAlign: 'left' }}>
                      <span>
                        <IconActionFavorite color='white' style={iconStatStyle}/>
                        <span>{media.node.likes_count}</span>
                      </span>
                      &nbsp;&nbsp;
                      <span>
                        <IconImageRemoveRedEye color='white' style={iconStatStyle}/>
                        <span>{media.node.visits_count}</span>
                      </span>
                    </IconButton>
                  }
                  actionPosition='left'
                  title='0'
                  titleStyle={{ opacity: 0 }}
                  titlePosition='bottom'
                  titleBackground='linear-gradient(to top, rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 70%,rgba(0,0,0,0) 100%)'
                >
                <a className='album-link'>
                  <img src={media.node.small_lscape_url ? media.node.small_lscape_url : ''} />
                  <div className='album-input-hover'>
                    <IconZoom color='#FFFFFF' style={{ width: 55, height: 55 }} />
                  </div>
                </a>
              </GridTile>
            );
          }
        });

        return (
          <div className='gallery'>
            <Dialog
              className='gallery-media-preview'
              modal={false}
              open={this.state.openShowMedia}
              onRequestClose={this.handleMediaDialogClose}
              autoDetectWindowHeight
              autoScrollBodyContent={!($(window).width() > 768)}
              contentStyle={ CommonStyles.dialog.gallery_content }
              bodyStyle={CommonStyles.dialog.body }
              style={ CommonStyles.dialog.root }
              repositionOnUpdate={ false }
            >
              <GalleryItem
                reloadGallery={this.reloadGallery}
                changeMediaId={this.changeMediaId}
                media_id={this.state.media_id}
                mediaIndex={this.state.mediaIndex}
                mediaIdArray={mediaIdArray}
                canShare={this.props.canShare}
                owner={this.props.owner}
              />
            </Dialog>
            <div className='topbar-filters filter-sort-block'>
              <div className='filters'>
                <Link to={galleryLink} className='active'>Albums</Link>
                {!this.props.username ? <Link to={galleryLink + '/all-media'}>Photos & Videos</Link> : ''}
              </div>
              {uploadAttachment}
            </div>
            <div className='gallery-inner'>
              <div className='album-title'>
                <span className='album-name'>{galleryItems.album !== null ? galleryItems.album.name + ' album' : 'Album name'}</span>
                {backLink}
              </div>
              <div className='gallery-images'>
                <div className='gallery-header'>Photos</div>
                {
                  images.length > 0 ?
                    <GridList
                      cols={cols}
                      cellHeight={cellHeight}
                      padding={8}
                      className='gallery-content'
                      style={gridStyles}
                    >
                      {images}
                    </GridList>
                   :
                   (this.props.username ? 'No images yet' : 'You have no images yet')
                 }
              </div>

              <div className='gallery-videos'>
                <div className='gallery-header'>Videos</div>
                {
                  videos.length > 0 ?
                    <GridList
                      cols={cols}
                      cellHeight={cellHeight}
                      padding={8}
                      className='gallery-content'
                      style={gridStyles}
                    >
                      {videos}
                    </GridList>
                   :
                   (this.props.username ? 'No videos yet' : 'You have no videos yet')
                 }
              </div>
            </div>
          </div>
        );
      }
      else {
        return (
          <div className='gallery'>
            <div className='topbar-filters filter-sort-block'>
              <div className='filters'>
                <Link to={galleryLink} className='active'>Albums</Link>
                {!this.props.username ? <Link to={galleryLink + '/all-media'}>Photos & Videos</Link> : ''}
              </div>
              {uploadAttachment}
            </div>
            <div className='gallery-inner'>

              <div className='album-title'>
                {galleryItems.album !== null ? galleryItems.album.name : 'Album name'}
                {backLink}
              </div>

              <div className='gallery-images'>
                <div className='gallery-header'>Photos</div>
                {this.props.username ? 'No images yet' : 'You have no images yet' }
              </div>

              <div className='gallery-videos'>
                <div className='gallery-header'>Videos</div>
                {this.props.username ? 'No videos yet' : 'You have no videos yet' }
              </div>

            </div>
          </div>
        );
      }

    }

  }
}

export default withApollo(hoc(GalleryAlbum));
