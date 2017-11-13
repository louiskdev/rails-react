/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import ReactDOM from 'react-dom';
import { Link } from 'react-router';
import IconButton from 'material-ui/IconButton';
import IconZoom from 'material-ui/svg-icons/action/zoom-in';
import IconPlay from 'material-ui/svg-icons/av/play-arrow';
import IconActionFavorite from 'material-ui/svg-icons/action/favorite';
import IconImageRemoveRedEye from 'material-ui/svg-icons/image/remove-red-eye';
import Dialog from 'material-ui/Dialog';
import { GridList, GridTile } from 'material-ui/GridList';

import hoc from './hoc';

import GalleryItem from '@common/GalleryItem';
import CommonStyles from '@utils/CommonStyles';

class GalleryAllMedia extends Component {

  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
      messagesContainerHeight: 600,
      openShowMedia: false,
      media_id: null,
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

  componentWillReceiveProps() {
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

  handleDialogOpen = (media_id) => {
    this.setState({
      media_id: media_id,
      openShowMedia: true,
    });
  }

  handleDialogClose = () => {
    this.setState({
      media_id: null,
      openShowMedia: false,
    });
  }

  reloadGallery = () => {
    this.handleMediaDialogClose();
    this.props.data.refetch();
  }

  render() {

    const gridStyles = {
      overflowY: 'auto',
    };

    let backLink = <Link to='/gallery'>Go back to My Albums</Link>;
    if (this.props.username) {
      backLink = <Link to={'/u/' + this.props.username + '/gallery'}>Go back to My Albums</Link>;
    }
    else if (this.props.permalink) {
      backLink = <Link to={'/b/' + this.props.permalink + '/gallery'}>Go back to My Albums</Link>;
    }

    if (!this.props.data.mediaFromGallery && !this.props.data.myGalleryAllMedia) {
      return (
        <div>
          Gallery media loading...
        </div>
      );
    }
    else {

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

      if (galleryItems.edges.length > 0) {

        const images = [];
        const videos = [];
        galleryItems.edges.map((media, index)=>{
          if (media.node.type === 'video') {
            videos.push(
              <GridTile
                  className='album-item'
                  key={index}
                  onClick={this.handleDialogOpen.bind(this, media.node.id)}
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
                    <IconPlay color='#FFFFFF' style={{ width: 80, height: 80 }} />
                  </div>
                </a>
              </GridTile>
            );
          }
          else {
            images.push(
              <GridTile
                  className='album-item'
                  key={index}
                  onClick={this.handleDialogOpen.bind(this, media.node.id)}
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
              onRequestClose={this.handleDialogClose}
              autoDetectWindowHeight
              autoScrollBodyContent={!($(window).width() > 768)}
              contentStyle={ CommonStyles.dialog.gallery_content }
              bodyStyle={ CommonStyles.dialog.body }
              style={ CommonStyles.dialog.root }
              repositionOnUpdate={ false }
            >
              <GalleryItem reloadGallery={this.reloadGallery} media_id={this.state.media_id} canShare={this.props.canShare} owner={this.props.owner} />
            </Dialog>
            <div className='topbar-filters filter-sort-block'>
              <div className='filters'>
                <Link to={galleryLink}>Albums</Link>
                <a className='active'>Photos & Videos</a>
              </div>
            </div>
            <div className='gallery-inner' style={{ height: this.state.messagesContainerHeight - 60 }}>
              <div className='gallery-images'>
                <div className='gallery-header'>All Photos ({images.length})</div>
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
                   'You have no images yet'
                 }
              </div>

              <div className='gallery-videos'>
                <div className='gallery-header'>All Videos ({videos.length})</div>
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
                   'You have no videos yet'
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
                <Link to={galleryLink}>Albums</Link>
                <a className='active'>Photos & Videos</a>
              </div>
            </div>
            <div className='gallery-inner'>

              <div className='gallery-images'>
                <div className='gallery-header'>Photos</div>
                You have no images yet
              </div>

              <div className='gallery-videos'>
                <div className='gallery-header'>Videos</div>
                You have no videos yet
              </div>

            </div>
          </div>
        );
      }

    }

  }
}

export default hoc(GalleryAllMedia);
