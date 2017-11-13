/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { notify } from 'react-notify-toast';
import { Link } from 'react-router';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import { Form as FormsyForm } from 'formsy-react';
import Paper from 'material-ui/Paper';
import IconInput from 'material-ui/svg-icons/action/input';
import IconButton from 'material-ui/IconButton';
import IconActionCamera from 'material-ui/svg-icons/image/camera-alt';

import FormsyCheckbox from 'formsy-material-ui/lib/FormsyCheckbox';
import { GridList, GridTile } from 'material-ui/GridList';
import ReactGA from 'react-ga';

import { withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import hoc from './hoc';

import FormText from '@common/form_text';
import CommonStyles from '@utils/CommonStyles';

type State = {
  openCreateBubbles: boolean,
  canSubmit: boolean,
  albumName: string,
  albumDescription: string,
  isSmallScreen: boolean,
  isMobileScreen: boolean
};

class Gallery extends Component {
  static contextTypes = {
    pusher: React.PropTypes.object,
  }

  constructor(props) {
    super(props);

    this.state = {
      openCreateBubbles: false,
      ignorePristine: false,
      canSubmit: false,
      albumName: '',
      albumDescription: '',
      privacy: true,
      isSmallScreen: $(window).width() < 600,
      isMobileScreen: $(window).width() < 767,
    };

  }

  componentDidMount() {
    this.subscribeToPusherChannel();
  }

  componentWillUnmount() {
    this.unsubscribeFromPusherChannel();
  }

  subscribeToPusherChannel = () => {
    const pusher = this.context.pusher;
    const bubblePermalink = this.props.params.permalink;

    if (bubblePermalink) {
      let bubbleChannel = pusher.channels.channels[`private-bubble-${bubblePermalink}`];
      if (!bubbleChannel) {
        bubbleChannel = pusher.subscribe(`private-bubble-${bubblePermalink}`);
      }
      bubbleChannel.bind('album_media_count_changed', this.handleAlbumCounters);
    }
    else {
      const user = JSON.parse(localStorage.getItem('mbubblz_user'));
      let userChannel = pusher.channels.channels['profile-page-' + user.id];
      if (!userChannel) {
        userChannel = pusher.subscribe('profile-page-' + user.id);
      }
      userChannel.bind('album_media_count_changed', this.handleAlbumCounters);
    }
  }

  unsubscribeFromPusherChannel = () => {
    const pusher = this.context.pusher;
    const bubblePermalink = this.props.params.permalink;

    if (bubblePermalink) {
      const bubbleChannel = pusher.channels.channels[`private-bubble-${bubblePermalink}`];
      if (!bubbleChannel) {
        bubbleChannel.unbind('album_media_count_changed', this.handleAlbumCounters);
        pusher.unsubscribe(`private-bubble-${bubblePermalink}`);
      }
    }
    else {
      const user = JSON.parse(localStorage.getItem('mbubblz_user'));
      const userChannel = pusher.channels.channels['profile-page-' + user.id];
      if (userChannel) {
        userChannel.unbind('album_media_count_changed', this.handleAlbumCounters);
        pusher.unsubscribe('profile-page-' + user.id);
      }
    }
  }

  handleAlbumCounters = (data) => {
    const newObj = {};
    newObj[`album_${data.album.id}`] = data.album.media_count;
    this.setState(newObj);
  }

  componentWillMount() {
    if (this.props.counters) {
      this.clearCounters();
    }
  }

  clearCounters = () => {
    this.props.changeCounter({
      ...this.props.counters,
      gallery_unread_items_count: 0,
    });
  }

  refetchAlbums = () => {
    if (this.props.permalink) {
      this.props.refetchAlbums();
    } else {
      this.props.data.refetch();
    }
    this.handleDialogClose();
  }

  handleDialogOpen = () => {
    this.setState({
      openCreateBubbles: true,
      privacy: true,
    });
  };

  handleDialogClose = () => {
    this.setState({
      openCreateBubbles: false,
      privacy: true,
    });
  };

  enableButton = () => {
    this.setState({
      canSubmit: true,
    });
  };

  disableButton = () => {
    this.setState({
      canSubmit: false,
    });
  };

  submitForm = (data) => {
    const self = this;
    const albumName = data.albumName;
    const albumDescription = data.albumDescription || '';

    const privacy = this.state.privacy ? 'private' : 'public';

    if (!albumName) {
      notify.show('Specify album name', 'error');
      return;
    }

    let params = '$albumName: String!, $albumDescription: String!';
    let input = 'name: $albumName, description: $albumDescription, privacy: "private"';
    let vars = {
      albumName: albumName,
      albumDescription: albumDescription,
    };

    if (this.props.permalink) {
      params = '$bubble_id: Int!, $albumName: String!, $albumDescription: String!, $privacy: String!';
      input = 'bubble_id: $bubble_id, name: $albumName, description: $albumDescription, privacy: $privacy';
      vars = {
        bubble_id: this.props.bubble_id,
        albumName: albumName,
        albumDescription: albumDescription,
        privacy: privacy,
      };
    }

    this.props.client.mutate({
      mutation: gql`
        mutation createNewAlbum(${params }) {
          createAlbum(input: {${input} }) {
            album {
              avatar_url
              gallery_id
              id
              media_count
              name
              user_id
          }
        }
      }
      `,
      variables: vars,
    },
    ).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors.message, 'error');
      }
      else {
        self.refetchAlbums();
        ReactGA.event({
          category: 'Gallery',
          action: 'Created an album',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      // console.log('there was an error sending the query', error);
    });
  };

  onKeyPress(event) {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */) {
      event.preventDefault();
    }
  }

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  };

  handleCheckedPrivacy = () => {
    this.setState({
      privacy: !this.state.privacy,
    });
  }

  render() {
    if (this.props.data.errors) {
      if (this.props.data.errors.graphQLErrors && this.props.data.errors.graphQLErrors[0].message === 'User is unauthorized') {
        setTimeout(() => {
          this.props.router.push('/signin');
        }, 50);
        setTimeout(()=> {
          localStorage.setItem('mbubblz_client_id', '');
          localStorage.setItem('mbubblz_token', '');
          localStorage.setItem('mbubblz_user', '');
          localStorage.setItem('mbubblz_username', '');
        }, 1000);
        return;
      }
    }
    const self = this;
    if (this.props.data.loading) {
      return (
        <div>
          Gallery loading...
        </div>
      );
    }
    else {

      const textStyle = {
        width: '100%',
      };

      const signButtonStyle = {
        height: '48px',
        width: this.state.isSmallScreen ? '97%' : 'auto',
        margin: this.state.isSmallScreen ? '1em 0 0 0' : '36px 5px 0',
      };

      const signButtonLabelStyle = {
        fontSize: '1.2em',
        textTransform: 'none',
        padding: '0px 30px',
        lineHeight: '50px',
      };

      const paperStyle = {
        width: $(window).width() > 480 ? '60%' : '100%',
        margin: '0 auto',
        textAlign: 'center',
        padding: $(window).width() > 480 ? '0 24px' : '0',
      };

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

      const errorStyle = {
        textAlign: 'left',
        position: 'static',
        bottom: '0',
        paddingLeft: '0',
        marginTop: '5px',
      };

      const gridStyles = {
        overflowY: 'auto',
      };

      const {
        ignorePristine,
        avatar_filename,
      } = this.state;

      let galleryAlbums = null;
      if (this.props.userGalleryAlbums) {
        galleryAlbums = this.props.userGalleryAlbums;
      }
      else if (this.props.galleryWidgetAlbums) {
        galleryAlbums = this.props.galleryWidgetAlbums;
      }
      else if (this.props.data.myGalleryAlbums && !(this.props.username || this.props.permalink)) {
        galleryAlbums = this.props.data.myGalleryAlbums;
      }

      let galleryLink = '/gallery';
      if (this.props.username) {
        galleryLink = '/u/' + this.props.username + '/gallery';
      }
      else if (this.props.permalink) {
        galleryLink = '/bubbles/' + this.props.permalink + '/gallery';
      }

      const checkBoxText = <span className='terms_links'>
        Allow others to contribute
      </span>;

      const createAlbumButton = !this.props.upload ? '' : <div className='gallery-actions'>
          {$(window).width() > 480 ?
            <FlatButton
              label='+ new album'
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
            modal={false}
            open={this.state.openCreateBubbles}
            onRequestClose={this.handleDialogClose}
            autoScrollBodyContent
          >
            <div className='complete-profile-wrapper create-album'>
              <FormsyForm
                onKeyPress={this.onKeyPress}
                onValid={this.enableButton}
                onInvalid={this.disableButton}
                onValidSubmit={this.submitForm}
                onInvalidSubmit={this.onInvalidFormSubmit}
                noValidate
              >

                <Paper style={paperStyle} zDepth={0} rounded={false}>
                  <FormText
                    name='albumName'
                    floatingLabelText='Album name'
                    style={textStyle}
                    underlineShow={false}
                    inputStyle={inputStyle}
                    floatingLabelStyle={labelStyle}
                    floatingLabelFocusStyle={labelFocusStyle}
                    errorStyle={errorStyle}
                    required
                    requiredError='You must enter album name'
                    ignorePristine={ignorePristine}
                  />
                  <FormText
                    name='albumDescription'
                    floatingLabelText='Album description'
                    underlineShow={false}
                    inputStyle={inputStyle}
                    floatingLabelStyle={labelStyle}
                    floatingLabelFocusStyle={labelFocusStyle}
                    errorStyle={errorStyle}
                    style={textStyle}
                  />
                  { this.props.permalink ? <FormsyCheckbox
                      name='agree_to_terms'
                      label={checkBoxText}
                      labelStyle={CommonStyles.checkbox.labelColor}
                      iconStyle={CommonStyles.checkbox.iconColor}
                      inputStyle={CommonStyles.checkbox.inputColor}
                      style={CommonStyles.checkbox.style}
                      onClick={this.handleCheckedPrivacy}
                      required
                    />
                    :
                    ''
                  }
                </Paper>
                <RaisedButton
                  fullWidth={!!this.state.isSmallScreen}
                  backgroundColor='#61D894'
                  label='Create Album'
                  labelColor='#FFFFFF'
                  labelStyle={signButtonLabelStyle}
                  style={signButtonStyle}
                  type='submit'
                  formNoValidate
                />
              </FormsyForm>
            </div>
          </Dialog>
        </div>;

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

      if (galleryAlbums.edges.length > 0) {
        return (
          <div className='gallery'>
            <div className='topbar-filters filter-sort-block'>
              <div className='filters'>
                <a className='active'>Albums</a>
                {!this.props.username ? <Link to={galleryLink + '/all-media'}>Photos & Videos</Link> : '' }
              </div>
              {createAlbumButton}
            </div>
            <div className='gallery-inner' style={{ padding: 28 }}>
              <GridList
                cols={cols}
                cellHeight={cellHeight}
                padding={8}
                className='gallery-content'
                style={gridStyles}
              >
                {
                  galleryAlbums.edges.map((album, index)=>{
                    return (<GridTile
                          className='album-item'
                          key={index}
                          actionIcon={
                            <IconButton style={{ width: 100, fontSize: 12, color: '#fff', textAlign: 'left' }}>
                              <span>
                                <IconActionCamera color='white' style={iconStatStyle}/>
                                <span>{this.state[`album_${album.node.id}`] ? this.state[`album_${album.node.id}`] : album.node.media_count}</span>
                              </span>
                            </IconButton>
                          }
                          actionPosition='left'
                          title={album.node.name}
                          titleStyle={{ textAlign: 'right' }}
                          titlePosition='bottom'
                          titleBackground='linear-gradient(to top, rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.3) 70%,rgba(0,0,0,0) 100%)'
                        >
                        <Link className='album-link' to={galleryLink + '/album/' + album.node.id}>
                          <img src={album.node.avatar_url} />
                          <div className='album-input-hover'>
                            <IconInput color='#FFFFFF' style={{ width: 36, height: 36 }} />
                          </div>
                        </Link>
                      </GridTile>
                    );
                  })
                }
              </GridList>
            </div>
          </div>
        );
      }
      else {
        return (
          <div className='gallery'>
            <div className='topbar-filters filter-sort-block'>
              <div className='filters'>
                <a className='active'>Albums</a>
                {!this.props.username ? <Link to={galleryLink + '/all-media'}>Photos & Videos</Link> : ''}
              </div>
              {createAlbumButton}
            </div>
            <div className='gallery-inner' style={{ padding: 28 }}>
              <div>
                {this.props.username ? 'No gallery items yet' : 'You have no gallery items yet'}
              </div>
            </div>
          </div>
        );
      }
    }
  }
}

export default withApollo(hoc(Gallery));
