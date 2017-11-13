import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import gql from 'graphql-tag';
import { withApollo } from 'react-apollo';
import IconPlay from 'material-ui/svg-icons/av/play-arrow';
import Video from 'react-html5video';
import { Circle } from 'rc-progress';

class VideoItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      videoProgress: 0,
      videoAttach: '',
      videoIsOpen: false,
      openedVideoMsgIndex: 0,
      isVideoUploading: true,
    };

    this.timeoutID = null;
  }

  componentDidMount() {
    if (this.props.isVideoUploading) {
      this.getVideoProgress(this.props.video.recoding_job_id, this.props.video.id);
    }
    this.onMount();
  }

  onMount = () => {
    this.setState({
      videoAttach: this.props.video,
      isVideoUploading: this.props.isVideoUploading,
    })
  }

  openVideo = (index, event) => {
    event.preventDefault();
    this.setState({
      videoIsOpen: true,
      openedVideoMsgIndex: index,
    });
  }

  closeVideo = () => {
    this.setState({
      videoIsOpen: false,
    });
  }

  getVideoProgress = (job_id, media_id) =>{
    const self = this;
    this.props.client.query({
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
        job_id: '' + job_id + '',
        media_id: parseInt(media_id),
      },
      forceFetch: true,
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors.message, 'error', 2000);
      }
      else {
        switch (data.videoUploadingProgress.state) {
        case 'waiting':
          notify.show('Video uploading waiting', 'error', 2000);
          break;
        case 'queued':
          notify.show('Video uploading added to queue', 'error', 2000);
          break;
        case 'assigning':
          notify.show('Video uploading assigning', 'error', 2000);
          break;
        case 'failed':
          notify.show('Video uploading failed', 'error', 2000);
          break;
        case 'no input':
          notify.show('Video uploading no input file', 'error', 2000);
          break;
        case 'skipped':
          notify.show('Video uploading skipped', 'error', 2000);
          break;
        case 'cancelled':
          notify.show('Video uploading cancelled', 'error', 2000);
          break;
        case 'finished':
          clearTimeout(this.timeoutID);
          this.timeoutID = null;
          self.setState({
            videoAttach: data.videoUploadingProgress.medium,
            videoProgress: data.videoUploadingProgress.progress,
            isVideoUploading: false,
          });
          break;
        case 'processing':
          self.setState({
            videoProgress: data.videoUploadingProgress.progress,
          });
          self.timeoutID = setTimeout(() => {
            self.getVideoProgress(job_id, media_id);
          }, 1000);
          break;
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  render() {
    const { isAlbum, height } = this.props;
    const { isVideoUploading, videoAttach } = this.state;
    return (
      <span>
        {
          !isVideoUploading && videoAttach ?
          (!isAlbum ?
            <div className='video-block full'>
              <Video controls loop muted poster={videoAttach.picture_url} style={{ height: height }}>
                <source src={videoAttach.video_links[0]} type='video/mp4' />
                <source src={videoAttach.video_links[1]} type='video/webm' />
                <source src={videoAttach.video_links[2]} type='video/ogv' />
              </Video>
            </div>
            :
            <a className='album-link'>
              <img src={videoAttach.picture_url ? videoAttach.picture_url : ''} />
              <div className='album-input-hover'>
                <IconPlay color='#FFFFFF' style={{ width: 80, height: 80 }} />
              </div>
            </a>
          )
          :
          <div className='video-block'>
            <span style={{ maxWidth: 100, display: 'block', float: 'none', margin: '0 auto', position: 'relative' }}>
              <Circle percent={this.state.videoProgress || 1} strokeWidth='8' strokeColor='#62db95' />
              <span
                style={{
                  position: 'absolute',
                  top: '33%',
                  left: this.state.videoProgress === 100 ? '28%' : '35%',
                  fontSize: '1.5em',
                  fontWeight: 'bold'
                }}
              >
                {this.state.videoProgress || 1}%
              </span>
            </span>
          </div>
        }
      </span>
    );
  }
}

export default withApollo(VideoItem);
