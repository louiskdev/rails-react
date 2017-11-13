/* @flow */

import React, { Component } from 'react';
import { Link } from 'react-router';
import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import Paper from 'material-ui/Paper';
import gql from 'graphql-tag';
import { withApollo } from 'react-apollo';
import ReactGA from 'react-ga';

import FormText from '@common/form_text';
import CommonStyles from '@utils/CommonStyles';

class ResetPasswordContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ignorePristine: false,
      canSubmit: false,
      passwordError: '',
      confirmPasswordError: '',
      loadingState: false,
    };
  }

  componentDidMount() {
    const userAgent = navigator.userAgent.toLowerCase();
    const IS_IPAD = userAgent.indexOf("ipad") > -1;
    const IS_IPHONE = !IS_IPAD && ((userAgent.indexOf("iphone") > -1) || (userAgent.indexOf("ipod") > -1));
    const IS_IOS = IS_IPAD || IS_IPHONE;
    const IS_ANDROID = !IS_IOS && userAgent.indexOf("android") > -1;
    const IS_MOBILE = IS_IOS || IS_ANDROID;

    const token = this.props.location.query.reset_password_token;
    const mobileRedirectUrl = `bubblez://resetPassword/${token}`;
    if (IS_MOBILE) {
      window.location = mobileRedirectUrl;
      //this.props.router.go(mobileRedirectUrl);
    }
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

  checkPassword(password, password_confirmation) {
    if (password !== password_confirmation) {
      this.setState({
        passwordError: 'You must enter the same password in both text fields',
        confirmPasswordError: 'You must enter the same password in both text fields',
      });
      return false;
    }
    if (!password || password.length < 6) {
      this.setState({
        passwordError: 'Password is too short (minimum is 6 characters)',
        confirmPasswordError: '',
      });
      return false;
    }
    return true;
  }

  submitForm = (data) => {
    const self = this;
    const password = data.password;
    const password_confirmation = data.password_confirmation;
    const reset_password_token = this.props.location.query.reset_password_token;

    if (!this.checkPassword(password, password_confirmation)) {
      return;
    }

    self.setState({
      loadingState: true,
    });

    this.props.client.mutate({
      mutation: gql`
        mutation resetPassword2($reset_password_token: String!, $password: String!, $password_confirmation:String!) {
          resetPasswordByToken(input: {
            reset_password_token: $reset_password_token,
            password: $password,
            password_confirmation: $password_confirmation
          }) {
            user {
              access_token
              client_id
              id
              username
              avatar_url(version: "micro")
              interests {
                edges {
                  node {
                    name
                    id
                  }
                }
              }
              first_name
              gender
              language
              birthday
              zip_code
            }
          }
        }
      `,
      variables: {
        reset_password_token: reset_password_token,
        password_confirmation: password_confirmation,
        password: password,
      },
    }).then((graphQLResult) => {

      const { errors, data } = graphQLResult;

      if (errors) {
        notify.show(errors.message, 'error');
        self.setState({
          loadingState: false,
        });
      }
      else {
        localStorage.setItem('mbubblz_token', data.resetPasswordByToken.user.access_token);
        localStorage.setItem('mbubblz_client_id', data.resetPasswordByToken.user.client_id);
        localStorage.setItem('mbubblz_user', JSON.stringify(data.resetPasswordByToken.user));
        notify.show('Awesome! Password successfully changed', 'success');

        ReactGA.event({
          category: 'User',
          action: 'Resetted password',
        });

        setTimeout(() => {
          self.setState({
            loadingState: false,
          });
          self.props.router.push('/');
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

  onInvalidFormSubmit = () => {
    this.setState({
      ignorePristine: true,
    });
  }

  clearPasswordError = () => {
    this.setState({
      passwordError: '',
      confirmPasswordError: '',
    });
  }

  render() {
    const { data } = this.props;
    const loading = false;// data.loading;

    const {
      ignorePristine,
      passwordError,
      confirmPasswordError,
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
                    name='password'
                    floatingLabelText='New password'
                    style={CommonStyles.outside.textStyle}
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    inputStyle={CommonStyles.outside.inputStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    required
                    requiredError='You must enter password'
                    ignorePristine={ignorePristine}
                    forcedError={passwordError}
                    onChange={this.clearPasswordError}
                    autoComplete='off'
                  />
                  <FormText
                    underlineShow={false}
                    name='password_confirmation'
                    floatingLabelText='Confirm password'
                    style={CommonStyles.outside.textStyle}
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    inputStyle={CommonStyles.outside.inputStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    type='password'
                    required
                    requiredError='You must enter confirm password'
                    ignorePristine={ignorePristine}
                    forcedError={confirmPasswordError}
                    onChange={this.clearPasswordError}
                    autoComplete='off'
                  />
                  <FlatButton
                    backgroundColor={CommonStyles.outside.buttonBackgroundColor}
                    hoverColor={CommonStyles.outside.buttonHoverColor}
                    label={ this.state.loadingState ? <div className='loader-wrapper'><div className='loader' /></div> : 'Change my password'}
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

export default withApollo(ResetPasswordContainer);
