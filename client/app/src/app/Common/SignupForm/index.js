/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import FormsyText from 'formsy-material-ui/lib/FormsyText';
import gql from 'graphql-tag';
import ReactGA from 'react-ga';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';

class SignupForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userEmail: '',
      canSubmit: false,
      formBackground: '#FFFFFF',
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
    const email = data.email;
    this.setState({
      formBackground: '#FFFFFF',
    });
    this.props.client.mutate({
      mutation: gql`
        mutation sendNewUserConfirmationEmail($email: String!) {
          sendConfirmationEmail(input: {email: $email }) {
            email
          }
        }
      `,
      variables: {
        email: email,
      },
    }).then((graphQLResult) => {
      const { errors } = graphQLResult;

      if (errors) {
        notify.show(errors.message, 'error', 2000);
      }
      else {
        notify.show('Awesome! You have registered successfully, Please, check email inbox', 'success', 3000);
        ReactGA.event({
          category: 'User',
          action: 'Signed up',
        });
      }
    }).catch((error) => {
      notify.show(error.message, 'error', 2000);
    });
  }

  notifyFormError = (data) => {
    this.setState({
      formBackground: '#F5B5B2',
    });
  }

  handleChangeUserEmail = (event) => {
    this.props.clearSliderTimer();
    this.props.setTypingStatus(true);
  }

  handleTyping = (event) => {
    this.setState({
      userEmail: event.target.value,
    });
    this.setState({
      formBackground: '#FFFFFF',
    });
  }

  render() {
    const signButtonStyle = {
      float: 'right',
      height: '48px',
      margin: '5px',
    };

    return (
      <div className='form-container formWrap'>
        <FormsyForm
          onValid={this.enableButton}
          onInvalid={this.disableButton}
          onValidSubmit={this.submitForm}
          onInvalidSubmit={this.notifyFormError}
          noValidate
          autoComplete='off'
        >
          <FormsyText
            className='form-signup-email'
            name='email'
            validations='isEmail'
            hintText='Email address'
            hintStyle={{ fontSize: '17px' }}
            style={CommonStyles.outside.emailAddressStyle}
            onChange={this.handleTyping}
            value={this.state.userEmail}
            onKeyUp={this.handleChangeUserEmail}
            underlineShow={false}
            required
          />
          <FlatButton
            backgroundColor={CommonStyles.outside.buttonBackgroundColor}
            className='form-signup-button'
            hoverColor={CommonStyles.outside.buttonHoverColor}
            label='Sign Up'
            labelStyle={CommonStyles.outside.signButtonLabelStyle}
            style={signButtonStyle}
            type='submit'
            formNoValidate
          />
        </FormsyForm>
      </div>
    );
  }
}

SignupForm.propTypes = {
  setTypingStatus: React.PropTypes.func,
  clearSliderTimer: React.PropTypes.func,
  mutate: React.PropTypes.func,
};

export default withApollo(SignupForm);
