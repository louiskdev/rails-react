/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import ReactGA from 'react-ga';
import RaisedButton from 'material-ui/RaisedButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import FormsyRadio from 'formsy-material-ui/lib/FormsyRadio';
import FormsyRadioGroup from 'formsy-material-ui/lib/FormsyRadioGroup';
import Paper from 'material-ui/Paper';
import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import AutoComplete from 'material-ui/AutoComplete';
import Chip from 'material-ui/Chip';
import Dropzone from 'react-dropzone';
import hoc from './hoc';
import CommonStyles from '@utils/CommonStyles';

import AvatarEditor from '@common/AvatarEditor';
import FormText from '@common/form_text';

class CreateOrUpdateBubble extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ignorePristine: false,
      canSubmit: false,
      bubbleName: '',
      zipcode: '',
      description: '',
      searchText: '',
      searchWidgetText: '',
      tempDataWidgetsSource: [],
      widgets: [
        {
          key: 1,
          label: 'Default',
        },
        {
          key: 2,
          label: 'Files',
        },
      ],
      tempDataSource: [],
      interests: [],
      files: [],
      avatar: '',
      avatar_filename: '',
      isSmallScreen: $(window).width() < 600,
      isMobileScreen: $(window).width() < 767,
      bubble_type: 'private',
      loadingState: false,
    };
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

  submitForm = (data) => {
    const self = this;
    const bubbleType = data.bubble_type;
    const bubbleName = data.bubbleName;
    const zip_code = data.zip_code || '';
    const description = data.description || '';
    const widgets = this.state.widgets.map((item, index)=> item.label);
    const interests = this.state.interests ?
      (this.state.interests.length > 0 ?
        this.state.interests.map((item, index)=> item.label)
        :
        ['']
      )
      :
      [''];
    const avatar_filename = this.state.avatar_filename ? this.state.avatar_filename : '';
    const avatar = this.state.avatar ? this.state.avatar : '';

    if (widgets.length === 0) {
      this.setState({
        ignorePristine: true,
      });
      return;
    }

    self.setState({
      loadingState: true,
    });

    const params = {
      bubbleName: bubbleName,
      zip_code: zip_code,
      description: description,
      interests: interests,
      avatar_filename: avatar_filename,
      avatar: avatar,
    };
    let mutation = null;
    if (this.props.update) {
      params.id = parseInt(this.props.bubble.id);
      mutation = this.props.updateBubble;
    }
    else {
      params.widgets = widgets;
      params.bubbleType = bubbleType;
      mutation = this.props.createNewBubble;
    }
    mutation({ variables: params })
    .then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        const message = errors.message ? errors.message : errors[0].message;
        notify.show(message, 'error');
        if (errors.graphQLErrors[0].message === 'User is unauthorized') {
          setTimeout(() => {
            this.props.router.push('/signin');
          }, 50);
          setTimeout(()=> {
            localStorage.setItem('mbubblz_client_id', '');
            localStorage.setItem('mbubblz_token', '');
            localStorage.setItem('mbubblz_user', '');
            localStorage.setItem('mbubblz_username', '');
          }, 1000);
        }
        self.setState({
          loadingState: false,
        });
      }
      else {
        self.setState({
          loadingState: false,
        });
        if (self.props.update) {
          notify.show('Bubble updated successfully', 'success');
          ReactGA.event({
            category: 'Bubble',
            action: 'Updated a bubble',
          });
          self.props.closeDialog();
          if (self.props.refetchBubbles) {
            self.props.refetchBubbles();
          }
        }
        else {
          notify.show('Bubble created successfully', 'success');
          ReactGA.event({
            category: 'Bubble',
            action: 'Created a bubble',
          });
          self.props.closeDialog(`/bubbles/${data.createBubble.bubble.permalink}`);
        }
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  filterInterests = (searchText, key) => {
    if (searchText === '') {
      return true;
    }
    else {
      return key.indexOf(searchText) !== -1;
    }
  }

  handleUpdateInterests = (value) => {
    const interests = this.state.interests;
    const self = this;

    const autoComplete = this.refs.select_interests;
    setTimeout(() => autoComplete && autoComplete.setState({ searchText: '' }), 100);

    const newInterest = {
      key: this.state.interests.length + 1,
      label: value,
    };
    interests.push(newInterest);

    const newArr = this.state.tempDataSource.filter(function(item) {
      return item !== value;
    });

    this.setState({
      interests: interests,
      tempDataSource: newArr,
    });

  }

  onKeyPress(event) {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */) {
      event.preventDefault();
    }
  }

  onKeyPressAutoField = (event) => {
    if (event.which === 13 && this.state.searchText === '') {
      this.handleUpdateInterests(this.state.tempDataSource[0]);
    }
    if (event.which === 44) {
      this.handleUpdateInterests(this.state.searchText);
    }
  }

  handleUpdateCustomInterests = (value) => {
    this.setState({
      searchText: value,
    });
  }

  handleDeleteInterest = (key) => {
    const interestsData = this.state.interests;
    const interestToDelete = interestsData.map((chip) => chip.key).indexOf(key);
    const deletedInterest = interestsData.splice(interestToDelete, 1);

    const newArr = [deletedInterest[0].label].concat(this.state.tempDataSource);

    this.setState({
      interests: interestsData,
      tempDataSource: newArr,
    });
  }

  renderInterest = (data) => {
    return (
      <Chip
        key={data.key}
        onRequestDelete={() => this.handleDeleteInterest(data.key)}
        className='tag'
        labelStyle={{ fontSize: 12, lineHeight: '26px', paddingLeft: '8px' }}
        style={{ margin: '0 2px', borderRadius: '4px', border: '4px' }}
      >
        {data.label}
      </Chip>
    );
  }

  filterWidgets = (searchText, key) => {
    if (searchText === '') {
      return true;
    }
    else {
      return key.indexOf(searchText) !== -1;
    }
  }

  handleUpdateWidgets = (value) => {
    const widgets = this.state.widgets;
    const self = this;

    // if (value === 'Blog' || value === 'Gallery' || value === 'Chat' || value === 'Events') {

    const autoComplete = this.refs.select_widgets;
    setTimeout(() => autoComplete && autoComplete.setState({ searchText: '' }), 100);

    const newWidget = {
      key: this.state.widgets.length + 1,
      label: value,
    };
    widgets.push(newWidget);

    const newArr = this.state.tempDataWidgetsSource.filter(function(item) {
      return item !== value;
    });

    this.setState({
      widgets: widgets,
      tempDataWidgetsSource: newArr,
    });
    // }
  }
  onKeyPressAutoFieldWidgets = (event) => {
    if (event.which === 13 && this.state.searchWidgetText === '') {
      this.handleUpdateWidgets(this.state.tempDataWidgetsSource[0]);
    }
    if (event.which === 44) {
      this.handleUpdateWidgets(this.state.searchWidgetText);
    }
  }

  handleUpdateCustomWidgets = (value) => {
    this.setState({
      searchWidgetText: value,
    });
  }

  handleDeleteWidget = (key) => {
    const widgetsData = this.state.widgets;
    const widgetToDelete = widgetsData.map((chip) => chip.key).indexOf(key);
    const deletedWidget = widgetsData.splice(widgetToDelete, 1);

    const newArr = [deletedWidget[0].label].concat(this.state.tempDataWidgetsSource);

    this.setState({
      widgets: widgetsData,
      tempDataWidgetsSource: newArr,
    });

  }

  renderWidget = (data) => {
    return (
      <Chip
        key={data.key}
        onRequestDelete={() => this.handleDeleteWidget(data.key)}
        className='tag'
        labelStyle={{ fontSize: 12, lineHeight: '26px', paddingLeft: '8px' }}
        style={{ margin: '0 2px', borderRadius: '4px', border: '4px' }}
      >
        {data.label}
      </Chip>
    );
  }

  setNewImg = (img) => {
    const files = this.state.files;
    files[0].preview = img;
    this.setState({
      files: files,
      avatar: img,
    });
  }

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  }

  setInitialState(props) {
    if (props.update && props.bubble) {

      const interests = [];
      if (props.bubble.interests) {
        props.bubble.interests.edges.map(interest => {
          interests.push({
            key: interests.length + 1,
            label: interest.node.name,
          });
        });
      }

      const widgets = [];
      if (props.bubble.events_widget_id) {
        widgets.push({
          key: widgets.length + 1,
          label: 'Events',
        });
      }
      if (props.bubble.blog_widget_id) {
        widgets.push({
          key: widgets.length + 1,
          label: 'Blog',
        });
      }
      if (props.bubble.chat_widget_id) {
        widgets.push({
          key: widgets.length + 1,
          label: 'Chat',
        });
      }
      if (props.bubble.gallery_widget_id) {
        widgets.push({
          key: widgets.length + 1,
          label: 'Gallery',
        });
      }

      this.setState({
        interests,
        widgets,
        bubble_type: (props.bubble.kind === 'privy' ? 'private' : 'public'),
      });
    }
  }

  componentWillMount() {
    this.setInitialState(this.props);
  }

  render() {

    const textStyle = {
      width: '100%',
      height: '60px',
    };

    const signButtonStyle = {
      height: '48px',
      width: '100%',
      margin: this.state.isSmallScreen ? 0 : '12px 5px 24px',
      boxShadow: 'none',
    };

    const signButtonLabelStyle = {
      fontSize: '1.2em',
      textTransform: 'none',
      lineHeight: '50px',
    };

    const styleRadioButton = {
      textAlign: 'left',
      display: this.state.isSmallScreen ? 'block' : 'inline-block',
      width: this.state.isSmallScreen ? '100%' : '50%',
      color: '#62db95',
    };

    const paperStyle = {
      height: 'auto',
      width: (
        this.props.update ?
        '100%'
        :
        (this.state.isMobileScreen ? '100%' : '90%')
      ),
      margin: 0,
      textAlign: 'center',
      display: 'inline-block',
      padding: '0 24px',
      boxShadow: 'none',
    };

    const inputStyle = {
      border: '1px solid #dfdfdf',
      borderRadius: '4px',
      padding: '12px 0 0 12px',
      height: '48px',
      marginTop: '0',
    };

    const labelStyle = {
      paddingLeft: '20px',
      fontSize: '14px',
      top: '18px',
      lineHeight: '44px',
      transform: 'scale(1) translate(0px, -16px)',
    };

    const labelFocusStyle = {
      top: '18px',
    };

    const errorStyle = {
      textAlign: 'left',
      position: 'static',
      bottom: '0',
      paddingLeft: '0',
      marginTop: '5px',
    };

    const {
      ignorePristine,
      avatar_filename,
    } = this.state;

    const { update, bubble } = this.props;

    return (
      <div className='complete-profile-wrapper create-bubble'>
        <FormsyForm
          onKeyPress={this.onKeyPress}
          onValid={this.enableButton}
          onInvalid={this.disableButton}
          onValidSubmit={this.submitForm}
          onInvalidSubmit={this.onInvalidFormSubmit}
          noValidate
        >
          <Paper style={{
            width: '100%',
            textAlign: 'center',
            margin: 0,
            boxShadow: 'none',
          }}
          rounded={false}
          className='upload-paper'
          >
            <Dropzone className='upload-avatar' onDrop={this.onDropDropzone} multiple={false} style={{ width: 90, height: 90 }}>
              {this.state.files.length > 0 ?
                <div>
                  {this.state.files.map((file) => <img src={file.preview} ref='image_preview'/>)}
                  <AvatarEditor aspectRatio={1 / 1} previewImg={this.state.avatar} setNewImg={this.setNewImg}/>
                </div>
                :
                (update && bubble ?
                  <img src={bubble.avatar_url} />
                  :
                  <CloudUpload color='#DFDFDF' style={{ width: '44px', height: '44px', margin: '20px 0' }}/>
                )
              }
            </Dropzone>
            {/* // Avatar isn't mandatory currently
              ignorePristine && !avatar_filename ?
              <span style={{ fontSize: '12px', lineHeight: '12px', color: 'rgb(244, 67, 54)' }}>
                You must upload avatar image
              </span>
              : ''
            */}
            <p style={{ fontSize: '0.7em', marginTop: 4 }}><b>Drag and drop</b> an image<br/> or click the icon above</p>
            {/* <p><b>Drag and drop</b> an image<br/> or click the icon above</p>
            <sup><span className="red">*</span>max size 2mb</sup>
            <sup><span className="red">*</span>jpg, png or gif</sup>*/}
          </Paper>

          <Paper style={paperStyle} zDepth={0} rounded={false}>
            {
              this.props.update ?
              undefined
              :
              <FormsyRadioGroup
                name='bubble_type'
                defaultSelected={this.state.bubble_type}
                style={{ margin: '8px 0' }}
                onChange={(event, value) => this.setState({ bubble_type: value })}>
                <FormsyRadio
                  value='private'
                  label='Private'
                  style={styleRadioButton}
                />
                <FormsyRadio
                  value='public'
                  label='Public'
                  style={styleRadioButton}
                />
              </FormsyRadioGroup>
            }

            <FormText
              name='bubbleName'
              defaultValue={update && bubble ? bubble.name : ''}
              floatingLabelText='Bubble name'
              style={textStyle}
              underlineShow={false}
              inputStyle={inputStyle}
              floatingLabelStyle={labelStyle}
              floatingLabelFocusStyle={labelFocusStyle}
              errorStyle={errorStyle}
              required
              requiredError='You must enter bubble name'
              ignorePristine={ignorePristine}
            />
            <FormText
              name='description'
              defaultValue={update && bubble ? bubble.description : ''}
              floatingLabelText='Bubble description'
              underlineShow={false}
              inputStyle={inputStyle}
              floatingLabelStyle={labelStyle}
              floatingLabelFocusStyle={labelFocusStyle}
              errorStyle={errorStyle}
              style={textStyle}
            />
            <FormText
              name='zip_code'
              defaultValue={update && bubble ? bubble.zip_code : ''}
              validations='isAlphanumeric'
              validationError='Invalid zipcode or location'
              floatingLabelText='Zipcode or location'
              style={textStyle}
              underlineShow={false}
              inputStyle={inputStyle}
              floatingLabelStyle={labelStyle}
              floatingLabelFocusStyle={labelFocusStyle}
              errorStyle={errorStyle}
              required
              requiredError='You must enter zipcode or location'
              ignorePristine={ignorePristine}
            />
            {
              this.props.update ?
              ''
              :
              <div>
                <AutoComplete
                  className='myb-autocomplete'
                  ref='select_widgets'
                  underlineShow={false}
                  inputStyle={inputStyle}
                  floatingLabelStyle={labelStyle}
                  floatingLabelFocusStyle={labelFocusStyle}
                  errorStyle={errorStyle}
                  dataSource={this.state.tempDataWidgetsSource}
                  onNewRequest={this.handleUpdateWidgets}
                  onUpdateInput={this.handleUpdateCustomWidgets}
                  onKeyPress={this.onKeyPressAutoFieldWidgets}
                  floatingLabelText='Select widgets'
                  searchText={this.state.searchWidgetText}
                  filter={this.filterWidgets}
                  openOnFocus
                  fullWidth
                  animated={false}
                  errorText={
                    (!this.state.ignorePristine || (this.state.widgets && this.state.widgets.length > 0)) ?
                    ''
                    :
                    'You must select at least one widget'}
                />
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  marginTop: '-12px',
                  marginBottom: '12px',
                }}>
                  {this.state.widgets.map(this.renderWidget, this)}
                </div>
              </div>
            }

            {this.state.bubble_type === 'private' ?
              null
              :
              <div>
                <AutoComplete
                  className='myb-autocomplete'
                  ref='select_interests'
                  underlineShow={false}
                  inputStyle={inputStyle}
                  floatingLabelStyle={labelStyle}
                  floatingLabelFocusStyle={labelFocusStyle}
                  errorStyle={errorStyle}
                  dataSource={this.state.tempDataSource}
                  onNewRequest={this.handleUpdateInterests}
                  onUpdateInput={this.handleUpdateCustomInterests}
                  onKeyPress={this.onKeyPressAutoField}
                  floatingLabelText='Enter Bubble Keywords'
                  searchText={this.state.searchText}
                  filter={this.filterInterests}
                  openOnFocus
                  maxSearchResults={10}
                  fullWidth
                  animated={false}
                  errorText={
                    (!this.state.ignorePristine || (this.state.interests && this.state.interests.length > 0)) ?
                    ''
                    :
                    'You must enter at least one interest'}
                />
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  marginTop: '-12px',
                  marginBottom: '12px',
                }}>
                  {this.state.interests.map(this.renderInterest, this)}
                </div>
              </div>
            }
            <RaisedButton
              fullWidth={!!this.state.isSmallScreen}
              backgroundColor={CommonStyles.outside.buttonBackgroundColor}
              hoverColor={CommonStyles.outside.buttonHoverColor}
              label={this.state.loadingState ?
                <div className='loader-wrapper'><div className='loader' /></div>
              :
                (this.props.update ? 'Update Bubble' : 'Create Bubble')
              }
              labelColor='#FFFFFF'
              labelStyle={signButtonLabelStyle}
              style={signButtonStyle}
              type='submit'
              formNoValidate
            />
          </Paper>

        </FormsyForm>
      </div>
    );
  }

}

export default hoc(CreateOrUpdateBubble);
