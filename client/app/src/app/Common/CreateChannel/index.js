/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import ReactGA from 'react-ga';

import FormText from '@common/form_text';
import FormSelect from '@common/form_select';

import hoc from './hoc';

class CreateChannel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ignorePristine: false,
      canSubmit: false,
      channelName: '',
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

  submitForm = (data) => {
    const self = this;
    const channelName = data.channelName;
    const channelType = data.channelType;
    const { chatId } = this.props;

    this.disableButton();
    this.props.createChannel({ variables: {
      chat_id: chatId,
      name: channelName,
      type: channelType,
    } }).then((graphQLResult) => {
      const { errors, data } = graphQLResult;
      if (errors) {
        notify.show(errors.message ? errors.message : errors[0].message, 'error');
        this.enableButton();
      }
      else {
        ReactGA.event({
          category: 'Chat',
          action: 'Created a channel',
        });
        this.props.onRequestClose();
      }
    }).catch((error) => {
      this.enableButton();
      notify.show(error.message, 'error');
    });
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
      top: '30px',
    };
    const errorCompleteStyle = {
      textAlign: 'left',
      position: 'static',
      bottom: '0',
      paddingLeft: '0',
      marginTop: '5px',
    };
    const iconSelectStyle = {
      right: '5px',
      top: '8px',
    };

    const {
      ignorePristine,
      avatar_filename,
      canSubmit,
    } = this.state;

    return (
      <div className='complete-profile-wrapper create-channel'>
        <FormsyForm
          onKeyPress={this.onKeyPress}
          onValid={this.enableButton}
          onInvalid={this.disableButton}
          onValidSubmit={this.submitForm}
          onInvalidSubmit={this.onInvalidFormSubmit}
          noValidate
        >
          <FormText
            name='channelName'
            floatingLabelText='Channel name'
            style={textStyle}
            underlineShow={false}
            inputStyle={inputStyle}
            floatingLabelStyle={labelStyle}
            floatingLabelFocusStyle={labelFocusStyle}
            errorStyle={errorStyle}
            required
            requiredError='You must enter channel name'
            ignorePristine={ignorePristine}
          />
          <FormSelect
            name='channelType'
            underlineShow={false}
            floatingLabelText='Channel Type'
            floatingLabelStyle={labelCompleteStyle}
            floatingLabelFocusStyle={labelCompleteFocusStyle}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              textAlign: 'left',
            }}
            maxHeight={150}
            inputStyle={inputSelectStyle}
            errorStyle={errorCompleteStyle}
            required
            requiredError='You must choose channel type'
            ignorePristine={ignorePristine}
          >
            <MenuItem value="global" innerDivStyle={menuItemsStyle} primaryText="Global" />
            <MenuItem value="privy" innerDivStyle={menuItemsStyle} primaryText="Private" />
          </FormSelect>
          <RaisedButton
            fullWidth={!!this.state.isSmallScreen}
            backgroundColor='#61D894'
            label='Create Channel'
            labelColor='#FFFFFF'
            labelStyle={signButtonLabelStyle}
            style={signButtonStyle}
            disabled={!canSubmit}
            type='submit'
            formNoValidate
          />
        </FormsyForm>
      </div>
    );
  }

}

export default hoc(CreateChannel);
