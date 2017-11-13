/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import $ from 'jquery';
import { Link } from 'react-router';
import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import FormsyRadio from 'formsy-material-ui/lib/FormsyRadio';
import FormsyRadioGroup from 'formsy-material-ui/lib/FormsyRadioGroup';
import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import AutoComplete from 'material-ui/AutoComplete';
import Chip from 'material-ui/Chip';
import Dropzone from 'react-dropzone';
import gql from 'graphql-tag';
import AvatarEditor from '@common/AvatarEditor';
import FormText from '@common/form_text';
import FormSelect from '@common/form_select';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';
import hoc from './hoc';

class CompleteProfileContainer extends Component {
  constructor(props) {
    super(props);

    const currentUser = !!localStorage.getItem('mbubblz_user');
    const authToken = !!localStorage.getItem('mbubblz_token');
    const clientID = !!localStorage.getItem('mbubblz_client_id');

    if (!this.props.location.query.confirmation_token) {
      if (currentUser && authToken && clientID) {
        this.props.router.push('/');
      }
      else {
        setTimeout(() => {
          this.props.router.push('/signin');
        }, 50);
      }
    }

    const currentDate = new Date();
    currentDate.setFullYear(currentDate.getFullYear() - 1);
    currentDate.setHours(0, 0, 0, 0);

    this.state = {
      ignorePristine: false,
      canSubmit: false,
      language: null,
      currentDate: currentDate,
      dataSource: [],
      tempDataSource: [],
      interests: [],
      searchText: '',
      files: [],
      avatar: '',
      avatar_filename: '',
      isSmallScreen: $(window).width() < 600,
      isMobileScreen: $(window).width() < 767,
      loadingState: false,
      month: '',
      day: '',
      year: '',
    };

    const self = this;
    $(window).resize(function() {
      self.updateScreen();
    });
  }

  componentDidMount() {
    const userAgent = navigator.userAgent.toLowerCase();
    const IS_IPAD = userAgent.indexOf("ipad") > -1;
    const IS_IPHONE = !IS_IPAD && ((userAgent.indexOf("iphone") > -1) || (userAgent.indexOf("ipod") > -1));
    const IS_IOS = IS_IPAD || IS_IPHONE;
    const IS_ANDROID = !IS_IOS && userAgent.indexOf("android") > -1;
    const IS_MOBILE = IS_IOS || IS_ANDROID;

    const token = this.props.location.query.confirmation_token;
    const mobileRedirectUrl = `bubblez://completeRegistration/${token}`;
    if (IS_MOBILE) {
      window.location = mobileRedirectUrl;
      //this.props.router.go(mobileRedirectUrl);
    }
  }

  updateScreen = () => {
    this.setState({
      isSmallScreen: $(window).width() < 600,
      isMobileScreen: $(window).width() < 767,
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

  onDropDropzone = (files) => {
    const self = this;
    const file = files[0];
    const reader = new FileReader();

    if (file) {
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
    else {
      notify.show('File indefined', 'error', 2000);
    }
  }

  onKeyPress(event) {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */) {
      event.preventDefault();
    }
  }

  submitForm = (data) => {
    const self = this;
    const token = this.props.location.query.confirmation_token;
    const username = data.username;
    const first_name = data.first_name || '';
    const zip_code = data.zip_code || '';
    const birthday = this.state.year + '-' + this.state.month + '-' + this.state.day;
    const gender = data.gender !== 'none' ? data.gender : '';
    const language = data.language ? data.language : 'English';
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

    if (!avatar_filename || !avatar) {
      this.setState({
        ignorePristine: true,
      });
      return;
    }

    self.setState({
      loadingState: true,
    });

    localStorage.setItem('mbubblz_username', username);

    this.props.client.mutate({
      mutation: gql`
        mutation setNewUserDetails(
          $confirmation_token: String!,
          $username: String!,
          $first_name: String!,
          $zip_code: String!,
          $birthday: String!,
          $gender: String!,
          $language: String!,
          $interests: [String],
          $avatar_filename: String!,
          $avatar: String!
        ) {
          setUserDetails(input: {
            confirmation_token: $confirmation_token,
            username: $username,
            first_name: $first_name,
            zip_code: $zip_code,
            birthday: $birthday,
            gender: $gender,
            language: $language,
            interests: $interests,
            avatar_filename: $avatar_filename,
            avatar: $avatar
          })
          {
            user {
              access_token
              client_id
            }
          }
        },
      `,
      variables: {
        confirmation_token: token,
        username: username,
        first_name: first_name,
        zip_code: zip_code,
        birthday: birthday,
        gender: gender,
        language: language,
        interests: interests,
        avatar_filename: avatar_filename,
        avatar: avatar,
      },
    },
    ).then((graphQLResult) => {
      const { errors, data } = graphQLResult;

      if (errors) {
        if (errors.length) {
          notify.show(errors[0].message, 'error');
        }
        else {
          notify.show(errors.message, 'error');
        }
        self.setState({
          loadingState: false,
        });
      }
      else {
        localStorage.setItem('mbubblz_token', data.setUserDetails.user.access_token);
        localStorage.setItem('mbubblz_client_id', data.setUserDetails.user.client_id);
        const token = self.props.location.query.new_member_token;
        if (token) {
          self.props.client.mutate({
            mutation: gql`
              mutation acceptInv($token: String!) {
                acceptBubbleInvitation(input: {token: $token }) {
                  status
                }
              }
            `,
            variables: {
              token: self.props.location.query.new_member_token,
            },
            forceFetch: true,
            activeCache: false,
          }).then((graphQLResult) => {
            const { errors, data } = graphQLResult;
            if (errors) {
              if (errors.length > 0) {
                notify.show(errors[0].message, 'error');
              }
            }
            else {
              // setTimeout(() => self.props.router.push('/bubbles/'+notification.bubble.permalink), 2000);
            }
          }).catch((error) => {
            notify.show(error.message, 'error');
          });
        }

        setTimeout(() => {
          self.setState({
            loadingState: false,
          });
          self.props.router.push('/create_password');
        }, 1000);
      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  handleLanguageChange = (event, value, index) => {
    this.setState({
      language: value,
    });
  }

  handleBirthdayChange = (event, date) => {
    this.setState({
      currentDate: date,
    });
  }

  handleUpdateInterests = (value) => {
    const interests = this.state.interests;
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
      searchText: '',
    });

    const autoComplete = this.refs.select_interests;
    setTimeout(() => autoComplete && autoComplete.setState({ searchText: '' }), 500);
  }

  filterInterests = (searchText, key) => {
    if (searchText === '') {
      return true;
    }
    else {
      return key.indexOf(searchText) !== -1;
    }
  }

  onKeyPressAutoField = (event, clicked) => {
    if (this.state.searchText === '') {
      if (event.which === 13) {
        this.handleUpdateInterests(this.state.tempDataSource[0]);
      }
    }
    else if (event.which === 13 || event.which === 44 || event.which === 32 || clicked) {
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

  renderInterest = (data) => (
    <Chip
      className='tag'
      key={data.key}
      onRequestDelete={() => this.handleDeleteInterest(data.key)}
      labelStyle={{ fontSize: 12, lineHeight: '26px', paddingLeft: '8px' }}
      style={{ margin: '0 2px', borderRadius: '4px', border: '4px' }}
    >
      {data.label}
    </Chip>
  )

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

  handleMonthChange = (event, value, index) => {
    this.setState({
      month: value,
    });
  }

  handleDayChange = (event, value, index) => {
    this.setState({
      day: value,
    });
  }

  handleYearChange = (event, value, index) => {
    this.setState({
      year: value,
    });
  }

  render() {
    const { data } = this.props;
    if (data.loading) {
      return (
        <div className='container'>
          <div className='complete-profile-wrapper'>Complete registration loading...</div>
        </div>
      );
    }
    else {
      if (data.checkConfirmationToken === 'Invalid' || data.checkConfirmationToken === 'Confirmed') {
        const user = localStorage.getItem('mbubblz_user');
        const token = localStorage.getItem('mbubblz_token');
        const clientID = localStorage.getItem('mbubblz_client_id');

        if (user && token && clientID) {
          this.props.router.push('/');
        }
        else {
          setTimeout(() => {
          this.props.router.push('/signin');
        }, 50);
        }
      }
      const {
        ignorePristine,
        avatar_filename,
      } = this.state;

      const signButtonStyle = {
        height: '48px',
        width: this.state.isSmallScreen ? '85%' : 'auto',
        margin: this.state.isSmallScreen ? '12px 0 12px' : '36px 5px 36px',
        borderRadius: '4px',
        minWidth: '180px',
      };

      const paperStyle = {
        margin: '0',
        textAlign: 'center',
        display: 'inline-block',
        padding: this.state.isSmallScreen ? '20px' : '50px',
      };

      const days = [];

      if (this.state.month) {
        if (
          this.state.month === '04' ||
          this.state.month === '06' ||
          this.state.month === '09' ||
          this.state.month === '11'
        ) {
          for (let i = 1; i < 31; i++) {
            days.push(
              <MenuItem key={i} value={i} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText={i} />
            );
          }
        }
        else if (this.state.month === '02') {
          for (let i = 1; i < 29; i++) {
            days.push(
              <MenuItem key={i} value={i} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText={i} />
            );
          }
        }
        else {
          for (let i = 1; i < 32; i++) {
            days.push(
              <MenuItem key={i} value={i} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText={i} />
            );
          }
        }
      }
      else {
        for (let i = 1; i < 32; i++) {
          days.push(
            <MenuItem key={i} value={i} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText={i} />
          );
        }
      }

      const years = [];
      const currentYear = new Date().getFullYear();
      for (let i = currentYear - 18; i > currentYear - 89; i--) {
        years.push(
          <MenuItem key={i} value={i} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText={i} />
        );
      }

      return (
        <div className='greenbg'>
          <div className='container'>
            <div className='complete-profile-wrapper'>
              <Link to='/' className='app-menubar-item app-logo logo'>
                <span className='app-logo-wrapper'>
                  <span className='app-logo-text'>z</span>
                </span>
              </Link>

              <div className='form-complete-profile'>
                <FormsyForm
                  onKeyPress={this.onKeyPress}
                  onValid={this.enableButton}
                  onInvalid={this.disableButton}
                  onValidSubmit={this.submitForm}
                  onInvalidSubmit={this.onInvalidFormSubmit}
                  noValidate
                >
                  <div className='papers-wrapper'>
                    <Paper
                      style={{
                        textAlign: 'center',
                        display: 'inline-block',
                        padding: '40px 50px',
                        float: 'left',
                        margin: '0',
                      }}
                      zDepth={0}
                      rounded={false}
                      className='upload-paper'
                    >
                      <Dropzone className='upload-avatar' onDrop={this.onDropDropzone} multiple={false}>
                        {this.state.files.length > 0 ?
                          <div>
                            {this.state.files.map((file) => <img src={file.preview} ref='image_preview' />)}
                            <AvatarEditor aspectRatio={1 / 1} previewImg={this.state.avatar} setNewImg={this.setNewImg} />
                          </div>
                        :
                          <CloudUpload color='#DFDFDF' style={{ width: '60px', height: '60px', margin: '36px 0' }} />
                        }
                      </Dropzone>
                      {
                        ignorePristine && !avatar_filename ?
                        <span style={{ fontSize: '12px', lineHeight: '12px', color: 'rgb(244, 67, 54)' }}>
                          You must upload avatar image
                        </span>
                      :
                        null
                      }
                      <p className='upload-hint'>Insert face picture<br/>Click on icon<br />to upload an avatar or <b>drag & drop</b> image</p>
                      <div className='upload-subhint'>
                        <span><span className='red'>*</span>max size 2mb</span>
                        <span><span className='red'>*</span>jpg, png or gif</span>
                      </div>
                    </Paper>
                    <Paper style={paperStyle} zDepth={0} rounded={false} className='user-fields-paper'>
                      <FormText
                        name='username'
                        underlineShow={false}
                        validations='isAlphanumeric'
                        validationError='Invalid username'
                        floatingLabelText='Username'
                        onChange={this.check}
                        style={CommonStyles.outside.textStyle}
                        inputStyle={CommonStyles.outside.inputStyle}
                        floatingLabelStyle={CommonStyles.outside.labelStyle}
                        floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                        errorStyle={CommonStyles.outside.errorStyle}
                        required
                        requiredError='You must enter username'
                        ignorePristine={ignorePristine}
                      />
                      <FormText
                        name='first_name'
                        underlineShow={false}
                        floatingLabelText='First name'
                        validations='isSpecialWords'
                        validationError='Invalid name'
                        style={CommonStyles.outside.textStyle}
                        inputStyle={CommonStyles.outside.inputStyle}
                        floatingLabelStyle={CommonStyles.outside.labelStyle}
                        floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                        errorStyle={CommonStyles.outside.errorStyle}
                        required
                        requiredError='You must enter first name'
                        ignorePristine={ignorePristine}
                      />
                      <FormsyRadioGroup
                        className='radio-wrapper'
                        name='gender'
                        defaultSelected='male'
                        style={{ margin: '0 0px 20px 0' }}
                      >
                        <FormsyRadio
                          value='male'
                          label='Male'
                          style={CommonStyles.outside.styleRadioButton}
                        />
                        <FormsyRadio
                          value='female'
                          label='Female'
                          style={CommonStyles.outside.styleRadioButton}
                        />
                        <FormsyRadio
                          value='none'
                          label='Other'
                          style={CommonStyles.outside.styleRadioButton}
                        />
                      </FormsyRadioGroup>
                      <FormSelect
                        name='language'
                        underlineShow={false}
                        value={this.state.language}
                        onChange={this.handleLanguageChange}
                        floatingLabelText='Language'
                        floatingLabelStyle={CommonStyles.outside.labelStyle}
                        floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                        fullWidth
                        style={CommonStyles.outside.selectStyle}
                        inputStyle={CommonStyles.outside.inputSelectStyle}
                        errorStyle={CommonStyles.outside.errorStyle}
                        iconStyle={CommonStyles.outside.iconSecelctStyle}
                        required
                        requiredError='You must choose language'
                        ignorePristine={ignorePristine}
                      >
                        <MenuItem key={0} value={'english'} primaryText='English' />
                        <MenuItem key={1} value={'french'} primaryText='French' className='inactive' disabled />
                        <MenuItem key={2} value={'russian'} primaryText='Russian' className='inactive' disabled />
                      </FormSelect>
                      <div style={{ fontSize: 12, fontWeight: 'bold', textAlign: 'left' }}>Birthdate</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
                        <FormSelect
                          name='month'
                          underlineShow={false}
                          value={this.state.month}
                          onChange={this.handleMonthChange}
                          floatingLabelText='Month'
                          floatingLabelStyle={CommonStyles.outside.labelStyle}
                          floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                          style={{
                            width: '31%',
                            height: 'auto',
                            display: 'inline-block',
                            textAlign: 'left',
                            margin: '0 4px 20px 0',
                          }}
                          maxHeight={150}
                          inputStyle={CommonStyles.outside.inputSelectStyle}
                          errorStyle={CommonStyles.outside.errorStyle}
                          iconStyle={CommonStyles.outside.iconSecelctStyle}
                          required
                          requiredError='You must choose bithday month'
                          ignorePristine={ignorePristine}
                        >
                          <MenuItem key={0} value={'01'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='January' />
                          <MenuItem key={1} value={'02'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='February' />
                          <MenuItem key={2} value={'03'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='March' />
                          <MenuItem key={3} value={'04'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='April' />
                          <MenuItem key={4} value={'05'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='May' />
                          <MenuItem key={5} value={'06'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='June' />
                          <MenuItem key={6} value={'07'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='July' />
                          <MenuItem key={7} value={'08'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='August' />
                          <MenuItem key={8} value={'09'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='September' />
                          <MenuItem key={9} value={'10'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='October' />
                          <MenuItem key={10} value={'11'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='November' />
                          <MenuItem key={11} value={'12'} innerDivStyle={CommonStyles.outside.menuItemsStyle} primaryText='December' />
                        </FormSelect>
                        <FormSelect
                          name='day'
                          underlineShow={false}
                          value={this.state.day}
                          onChange={this.handleDayChange}
                          floatingLabelText='Day'
                          floatingLabelStyle={CommonStyles.outside.labelStyle}
                          floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                          style={{
                            width: '31%',
                            height: 'auto',
                            display: 'inline-block',
                            textAlign: 'left',
                            margin: '0 3px 20px 3px',
                          }}
                          maxHeight={150}
                          inputStyle={CommonStyles.outside.inputSelectStyle}
                          errorStyle={CommonStyles.outside.errorStyle}
                          iconStyle={CommonStyles.outside.iconSecelctStyle}
                          required
                          requiredError='You must choose bithday day'
                          ignorePristine={ignorePristine}
                        >
                          {days}
                        </FormSelect>
                        <FormSelect
                          name='year'
                          underlineShow={false}
                          value={this.state.year}
                          onChange={this.handleYearChange}
                          floatingLabelText='Year'
                          floatingLabelStyle={CommonStyles.outside.labelStyle}
                          floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                          style={{
                            width: '31%',
                            height: 'auto',
                            display: 'inline-block',
                            textAlign: 'left',
                            margin: '0 0 20px 4px',
                          }}
                          maxHeight={150}
                          inputStyle={CommonStyles.outside.inputSelectStyle}
                          errorStyle={CommonStyles.outside.errorStyle}
                          iconStyle={CommonStyles.outside.iconSecelctStyle}
                          required
                          requiredError='You must choose bithday year'
                          ignorePristine={ignorePristine}
                        >
                          {years}
                        </FormSelect>
                      </div>
                      <FormText
                        name='zip_code'
                        underlineShow={false}
                        validations='isAlphanumeric'
                        validationError='Invalid zipcode or location'
                        floatingLabelText='Zipcode or location'
                        style={CommonStyles.outside.textStyle}
                        inputStyle={CommonStyles.outside.inputStyle}
                        floatingLabelStyle={CommonStyles.outside.labelStyle}
                        floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                        errorStyle={CommonStyles.outside.errorStyle}
                        required
                        requiredError='You must enter zipcode or location'
                        ignorePristine={ignorePristine}
                      />
                      <AutoComplete
                        className='myb-autocomplete'
                        ref='select_interests'
                        underlineShow={false}
                        dataSource={this.state.tempDataSource}
                        onUpdateInput={this.handleUpdateCustomInterests}
                        onKeyPress={(event) => this.onKeyPressAutoField(event, false)}
                        floatingLabelText='Interests'
                        style={CommonStyles.outside.interestsStyle}
                        inputStyle={CommonStyles.outside.inputStyle}
                        floatingLabelStyle={CommonStyles.outside.labelStyle}
                        floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                        errorStyle={CommonStyles.outside.errorStyle}
                        searchText={this.state.searchText ? this.state.searchText : ''}
                        filter={this.filterInterests}// AutoComplete.noFilter}
                        openOnFocus
                        maxSearchResults={10}
                        fullWidth
                        animated={false}
                        errorText={
                        (!this.state.ignorePristine || (this.state.interests && this.state.interests.length > 0)) ?
                          ''
                        :
                          'You must enter at least one interest'
                        }
                      />
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          position: 'relative',
                        }}
                      >
                        <a
                          id='add-link'
                          onClick={this.state.searchText !== '' ? ((event) => this.onKeyPressAutoField(event, true)) : null}
                          style={{
                            color: this.state.searchText !== '' ? '#68C39F' : '#DFDFDF',
                            position: 'absolute',
                            right: '10px',
                            top: '-54px',
                          }}
                        >
                          add
                        </a>
                        {this.state.interests.map(this.renderInterest, this)}
                      </div>
                    </Paper>
                  </div>
                  <div style={{ backgroundColor: '#FFF', marginTop: '-4px;' }}>
                    <FlatButton
                      fullWidth={this.state.isSmallScreen}
                      backgroundColor={CommonStyles.outside.buttonBackgroundColor}
                      hoverColor={CommonStyles.outside.buttonHoverColor}
                      label={ this.state.loadingState ?
                        <div className='loader-wrapper'><div className='loader' /></div>
                      :
                        'Continue'
                      }
                      labelStyle={CommonStyles.outside.signButtonLabelStyle}
                      style={signButtonStyle}
                      type='submit'
                      formNoValidate
                    />
                  </div>
                </FormsyForm>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}

CompleteProfileContainer.propTypes = {
  mutate: React.PropTypes.func,
  data: React.PropTypes.object,
  query: React.PropTypes.func,
  location: React.PropTypes.object,
  router: React.PropTypes.object,
};

export default withApollo(hoc(CompleteProfileContainer));
