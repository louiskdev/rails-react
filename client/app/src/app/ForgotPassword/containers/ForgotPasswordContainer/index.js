/* @flow */
/* eslint-disable max-len */

import React, { Component } from 'react';
import { Link } from 'react-router';
import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import Paper from 'material-ui/Paper';
import gql from 'graphql-tag';

import FormText from '@common/form_text';
import CommonStyles from '@utils/CommonStyles';
import { withApollo } from 'react-apollo';

class ForgotPasswordContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ignorePristine: false,
      canSubmit: false,
      loadingState: false,
    };
  }

  enableButton = () => {
    if (this.state.isAgreed) {
      this.setState({
        canSubmit: true,
      });
    }
  }

  disableButton = () => {
    this.setState({
      canSubmit: false,
    });
  }

  submitForm = (data) => {
    const self = this;
    const login = data.login;
    self.setState({
      loadingState: true,
    });
    this.props.client.mutate({
      mutation: gql`
        mutation resetPassword1($login: String!) {
          resetPasswordRequest(input: {
            login: $login
          }) {
            login
          }
        }
      `,
      variables: {
        login: login,
      },
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors[0].message, 'error');
        self.setState({
          loadingState: false,
        });
      }
      else {
        self.setState({
          loadingState: false,
        });
        setTimeout(() => {
          notify.show('Awesome! Please, check your email inbox', 'success');
        }, 500);

      }
    }).catch((error) => {
      notify.show(error.message, 'error');
      self.setState({
        loadingState: false,
      });
      // console.log('there was an error sending the query', error);
    });
  }

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  }

  render() {
    const { data } = this.props;
    const loading = false;// data.loading;
    const isSmallScreen = $(window).width() < 600;

    const {
      ignorePristine,
    } = this.state;

    return (
      <div className='greenbg'>
        {loading &&
          <div>Page loading ...</div>
        }
        {!loading &&
        <div className='container'>
          <div className='signin-wrapper'>
            <Link to='/' className='app-menubar-item app-logo logo'>
              <span className='app-logo-wrapper'>
                <span className='app-logo-text'>z</span>
              </span>
            </Link>
            <div className='form-complete-profile'>
              <FormsyForm
                onValid={this.enableButton}
                onInvalid={this.disableButton}
                onValidSubmit={this.submitForm}
                onInvalidSubmit={this.onInvalidFormSubmit}
                noValidate
                autoComplete='off'
              >
                <Paper style={CommonStyles.outside.paperStyle} zDepth={0} rounded={false} className='user-fields-paper'>
                  <FormText
                    underlineShow={false}
                    name='login'
                    validations={{ matchRegexp: /[a-zA-Z0-9\_\+\-\@\.]/ }}
                    validationError='Invalid login'
                    floatingLabelText='Username or Email'
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    style={CommonStyles.outside.textStyle}
                    inputStyle={CommonStyles.outside.inputStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    required
                    requiredError='You must enter username or login'
                    ignorePristine={ignorePristine}
                  />
                  <FlatButton
                    backgroundColor={CommonStyles.outside.buttonBackgroundColor}
                    hoverColor={CommonStyles.outside.buttonHoverColor}
                    label={ this.state.loadingState ? <div className='loader-wrapper'><div className='loader' /></div> : 'Reset my password'}
                    labelColor={CommonStyles.outside.buttonLabelColor}
                    labelStyle={CommonStyles.outside.signButtonLabelStyle}
                    style={CommonStyles.outside.signButtonStyle}
                    type='submit'
                    formNoValidate
                  />
                </Paper>
              </FormsyForm>
            </div>
          </div>
        </div>
        }
      </div>
    );
  }

}

export default withApollo(ForgotPasswordContainer);
