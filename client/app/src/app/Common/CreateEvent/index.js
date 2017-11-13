/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import CloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import Dropzone from 'react-dropzone';
import ReactGA from 'react-ga';
import hoc from './hoc';

import AvatarEditor from '@common/AvatarEditor';
import FormText from '@common/form_text';
import FormSelect from '@common/form_select';

class CreateEvent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ignorePristine: false,
      canSubmit: false,
      eventName: '',
      description: '',
      files: [],
      avatar: '',
      avatar_filename: '',
      isSmallScreen: $(window).width() < 600,
      isMobileScreen: $(window).width() < 767,
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
    const eventName = data.eventName;
    const address = data.address || '';
    const description = data.description || '';
    const avatar_filename = this.state.avatar_filename ? this.state.avatar_filename : '';
    const avatar = this.state.avatar ? this.state.avatar : '';
    const { year, month, day, hour } = this.state;
    const eventDate = new Date(year, month, day, hour);

    this.props.createEvent({ variables: {
      name: eventName,
      avatar: avatar,
      avatar_filename: avatar_filename,
      type: '',
      start_date: eventDate.getUTCFullYear() + '-' + (eventDate.getUTCMonth() + 1) + '-' + eventDate.getUTCDate() + ' ' + eventDate.getUTCHours() + ':00:00',
      address: address,
      description: description,
      bubble_id: parseInt(this.props.bubbleId),
    } }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        notify.show(errors.message ? errors.message : errors[0].message, 'error');
      }
      else {
        ReactGA.event({
          category: 'Event',
          action: 'Created an event',
        });
      }
      this.props.onRequestClose();
    }).catch((error) => {
      this.props.onRequestClose();
      notify.show(error.message, 'error');
      // console.log('there was an error sending the query', error);
    });
  }

  onKeyPress(event) {
    if (event.which === 13 || event.keyCode === 13 || event.charCode === 13 /* Enter */) {
      event.preventDefault();
    }
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

  handleHourChange = (event, value, index) => {
    this.setState({
      hour: value,
    });
  }

  render() {

    const textStyle = {
      width: '100%',
    };

    const signButtonStyle = {
      height: '48px',
      width: this.state.isSmallScreen ? '97%' : 'auto',
      margin: this.state.isSmallScreen ? 0 : '36px 5px 0',
      boxShadow: 'none',
    };

    const signButtonLabelStyle = {
      fontSize: '1.2em',
      textTransform: 'none',
      padding: '0px 30px',
      lineHeight: '50px',
    };

    const paperStyle = {
      height: 'auto',
      width: '100%',
      margin: 0,
      textAlign: 'center',
      display: 'inline-block',
      padding: '8px 24px 20px 24px',
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
      top: '26px',
    };

    const labelFocusStyle = {
      top: '26px',
    };

    const errorStyle = {
      textAlign: 'left',
      position: 'static',
      bottom: '0',
      paddingLeft: '0',
      marginTop: '5px',
    };

    const inputSelectStyle = {
      border: '1px solid #dfdfdf',
      borderRadius: '4px',
      width: '100%',
      height: '56px',
      marginTop: '0',
      fontSize: '15px',
      paddingLeft: '18px',
    };

    const menuItemsStyle = {
      padding: '0 20px',
    };

    const labelCompleteStyle = {
      paddingLeft: '25px',
      fontSize: '15px',
      top: '18px',
    };

    const labelCompleteFocusStyle = {
      top: '44px',
    };

    const errorCompleteStyle = {
      textAlign: 'left',
      position: 'static',
      bottom: '0',
      paddingLeft: '0',
      marginTop: '5px',
    };

    const iconSelectStyle = {
      right: '0px',
      top: '4px',
    };

    const {
      ignorePristine,
      avatar_filename,
    } = this.state;

    const days = [];

    if (this.state.month) {
      if (
        this.state.month === 4 ||
        this.state.month === 6 ||
        this.state.month === 9 ||
        this.state.month === 11
      ) {
        for (var i = 1; i < 31; i++) {
          days.push(<MenuItem key={i} value={i} innerDivStyle={menuItemsStyle} primaryText={i} />);
        }
      }
      else if (this.state.month === 2) {
        for (var i = 1; i < 29; i++) {
          days.push(<MenuItem key={i} value={i} innerDivStyle={menuItemsStyle} primaryText={i} />);
        }
      }
      else {
        for (var i = 1; i < 32; i++) {
          days.push(<MenuItem key={i} value={i} innerDivStyle={menuItemsStyle} primaryText={i} />);
        }
      }
    }
    else {
      for (var i = 1; i < 32; i++) {
        days.push(<MenuItem key={i} value={i} innerDivStyle={menuItemsStyle} primaryText={i} />);
      }
    }

    const years = [];
    const currYear = new Date().getFullYear();
    for (var i = currYear; i <= currYear + 20; i++) {
      years.push(<MenuItem key={i} value={i} innerDivStyle={menuItemsStyle} primaryText={i} />);
    }

    const hours = [];
    for (var i = 0; i < 24; i++) {
      const pm = i > 11;
      const h = pm ? i - 12 : i;
      hours.push(<MenuItem key={i} value={i} innerDivStyle={menuItemsStyle} primaryText={h + (pm ? ' PM' : ' AM')} />);
    }

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
            height: 'auto',
            width: '100%',
            textAlign: 'center',
            display: (this.props.update ? 'none' : 'inline-block'),
            padding: '14px 20px 0px',
            margin: 0,
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
              : ''
            }
            <p><b>Drag and drop</b> an image<br /> or click the icon above</p>
          </Paper>

          <Paper style={paperStyle} zDepth={0} rounded={false}>
            <FormText
              name='eventName'
              floatingLabelText='Event name'
              style={textStyle}
              underlineShow={false}
              inputStyle={inputStyle}
              floatingLabelStyle={labelStyle}
              floatingLabelFocusStyle={labelFocusStyle}
              errorStyle={errorStyle}
              required
              requiredError='You must enter event name'
              ignorePristine={ignorePristine}
            />
            <FormText
              name='address'
              floatingLabelText='Event location address'
              style={textStyle}
              underlineShow={false}
              inputStyle={inputStyle}
              floatingLabelStyle={labelStyle}
              floatingLabelFocusStyle={labelFocusStyle}
              errorStyle={errorStyle}
              required
              requiredError='You must enter event address'
              ignorePristine={ignorePristine}
            />
            <FormText
              name='description'
              floatingLabelText='Event description'
              underlineShow={false}
              inputStyle={inputStyle}
              floatingLabelStyle={labelStyle}
              floatingLabelFocusStyle={labelFocusStyle}
              errorStyle={errorStyle}
              style={textStyle}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormSelect
                name='year'
                underlineShow={false}
                value={this.state.year}
                onChange={this.handleYearChange}
                floatingLabelText='Year'
                floatingLabelStyle={labelCompleteStyle}
                floatingLabelFocusStyle={labelCompleteFocusStyle}
                style={{
                  width: '31%',
                  height: 'auto',
                  display: 'inline-block',
                  textAlign: 'left',
                  margin: '0 3px 20px 0',
                }}
                maxHeight={150}
                inputStyle={inputSelectStyle}
                errorStyle={errorCompleteStyle}
                iconStyle={iconSelectStyle}
                required
                requiredError='You must choose start date'
                ignorePristine={ignorePristine}
              >
                {years}
              </FormSelect>
              <FormSelect
                name='month'
                underlineShow={false}
                value={this.state.month}
                onChange={this.handleMonthChange}
                floatingLabelText='Month'
                floatingLabelStyle={labelCompleteStyle}
                floatingLabelFocusStyle={labelCompleteFocusStyle}
                style={{
                  width: '31%',
                  height: 'auto',
                  display: 'inline-block',
                  textAlign: 'left',
                  margin: '0 3px 20px',
                }}
                maxHeight={150}
                inputStyle={inputSelectStyle}
                errorStyle={errorCompleteStyle}
                iconStyle={iconSelectStyle}
                required
                requiredError='You must choose start date'
                ignorePristine={ignorePristine}
              >
                <MenuItem key={0} value={0} innerDivStyle={menuItemsStyle} primaryText='January' />
                <MenuItem key={1} value={1} innerDivStyle={menuItemsStyle} primaryText='February' />
                <MenuItem key={2} value={2} innerDivStyle={menuItemsStyle} primaryText='March' />
                <MenuItem key={3} value={3} innerDivStyle={menuItemsStyle} primaryText='April' />
                <MenuItem key={4} value={4} innerDivStyle={menuItemsStyle} primaryText='May' />
                <MenuItem key={5} value={5} innerDivStyle={menuItemsStyle} primaryText='June' />
                <MenuItem key={6} value={6} innerDivStyle={menuItemsStyle} primaryText='July' />
                <MenuItem key={7} value={7} innerDivStyle={menuItemsStyle} primaryText='August' />
                <MenuItem key={8} value={8} innerDivStyle={menuItemsStyle} primaryText='September' />
                <MenuItem key={9} value={9} innerDivStyle={menuItemsStyle} primaryText='October' />
                <MenuItem key={10} value={10} innerDivStyle={menuItemsStyle} primaryText='November' />
                <MenuItem key={11} value={11} innerDivStyle={menuItemsStyle} primaryText='December' />
              </FormSelect>
              <FormSelect
                name='day'
                underlineShow={false}
                value={this.state.day}
                onChange={this.handleDayChange}
                floatingLabelText='Day'
                floatingLabelStyle={labelCompleteStyle}
                floatingLabelFocusStyle={labelCompleteFocusStyle}
                style={{
                  width: '31%',
                  height: 'auto',
                  display: 'inline-block',
                  textAlign: 'left',
                  margin: '0 3px 20px 3px',
                }}
                maxHeight={150}
                inputStyle={inputSelectStyle}
                errorStyle={errorCompleteStyle}
                iconStyle={iconSelectStyle}
                required
                requiredError='You must choose start date'
                ignorePristine={ignorePristine}
              >
                {days}
              </FormSelect>
              <FormSelect
                name='hour'
                underlineShow={false}
                value={this.state.hour}
                onChange={this.handleHourChange}
                floatingLabelText='Hour'
                floatingLabelStyle={labelCompleteStyle}
                floatingLabelFocusStyle={labelCompleteFocusStyle}
                style={{
                  width: '31%',
                  height: 'auto',
                  display: 'inline-block',
                  textAlign: 'left',
                  margin: '0 3px 20px 3px',
                  whiteSpace: 'nowrap',
                }}
                maxHeight={150}
                inputStyle={inputSelectStyle}
                errorStyle={errorCompleteStyle}
                iconStyle={iconSelectStyle}
                required
                requiredError='You must choose start time'
                ignorePristine={ignorePristine}
              >
                {hours}
              </FormSelect>
            </div>
          </Paper>
          <RaisedButton
            fullWidth={!!this.state.isSmallScreen}
            backgroundColor='#61D894'
            label='Create Event'
            labelColor='#FFFFFF'
            labelStyle={signButtonLabelStyle}
            style={signButtonStyle}
            type='submit'
            formNoValidate
          />
        </FormsyForm>
      </div>
    );
  }

}

export default hoc(CreateEvent);
