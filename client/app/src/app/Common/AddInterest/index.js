/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { Form as FormsyForm } from 'formsy-react';

import ReactGA from 'react-ga';

import CommonStyles from '@utils/CommonStyles';
import FormText from '@common/form_text';

class AddInterest extends Component {

  constructor(props) {
    super(props);
    this.state = {
      interest: '',
      ignorePristine: false,
      canSubmit: true,
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
  };

  addInterest = () => {
    this.props.addInterest(this.state.interest);
    ReactGA.event({
      category: 'User',
      action: 'Added an interest',
    });
  };

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  };

  onChangeInterest = (e) => {
    this.setState({
      interest: e.currentTarget.value,
    });
  };

  render() {

    return (
      <div className='search-wrapper'>
        <div style={{ padding: '20px 24px' }}>
          <FormsyForm
            onValidSubmit={this.addInterest}
            onInvalidSubmit={this.onInvalidFormSubmit}
            noValidate
          >
            <h1 style={{
              margin: '0',
              color: '#555',
              fontSize: '1.4em',
              marginBottom: '36px',
              paddingBottom: '16px',
              borderBottom: '1px solid #efefef',
            }}>Enter a name of your interest</h1>
            <FormText
              name='interest'
              value={this.state.interest}
              validations='isAlphanumeric'
              validationError='Invalid interest name'
              required
              requiredError='You must enter interest to add'
              errorStyle={CommonStyles.outside.errorStyle}
              floatingLabelText='Interest'
              onChange={this.onChangeInterest}
              style={CommonStyles.outside.textStyle}
              underlineShow={false}
              inputStyle={CommonStyles.outside.inputStyle}
              floatingLabelStyle={CommonStyles.outside.labelStyle}
              floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
              ignorePristine={this.state.ignorePristine}
            />
          <div style={{ marginTop: 24 }}>
            <RaisedButton
              backgroundColor={CommonStyles.outside.buttonBackgroundColor}
              hoverColor={CommonStyles.outside.buttonHoverColor}
              label='Add Interest'
              labelColor='#FFFFFF'
              labelStyle={{ textTransform: 'capitalize', fontSize: 15, padding: '0 24px' }}
              type='submit'
              style={{ boxShadow: 'none', height: 40, minWidth: 100 }}
              disabled={!this.state.canSubmit}
            />
            <a style={{ color: '#999', marginLeft: 18, fontSize: 14 }} onClick={this.props.cancelRequest}>Cancel</a>
          </div>
        </FormsyForm>
      </div>
    </div>
    );
  }
}

export default AddInterest;
