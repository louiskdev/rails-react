/* @flow */

import React, { Component } from 'react';
import $ from 'jquery';
import { Link } from 'react-router';
import FlatButton from 'material-ui/FlatButton';
import { notify } from 'react-notify-toast';
import { Form as FormsyForm } from 'formsy-react';
import Paper from 'material-ui/Paper';
import gql from 'graphql-tag';
import ReactGA from 'react-ga';
import FormText from '../../../Common/form_text';
import CommonStyles from '@utils/CommonStyles';

import { withApollo } from 'react-apollo';

class SignInContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ignorePristine: false,
      canSubmit: false,
      loginError: '',
      passwordError: '',
      loadingState: false,
    };
  }

  componentDidMount() {
    setTimeout(() => {
      if (this.refs.username && this.refs.username.getValue()) {
        this.refs.password.setState({ ...this.refs.password.state, hasValue: true });
      }
    }, 10000);
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

  validateRequiredFields = (data) => {
    const login = data.login || $('input[name="login"]').val();
    const password = data.password || $('input[name="password"]').val();
    let validated = true;

    if (!login) {
      this.setState({
        ignorePristine: true,
        loginError: 'You must enter your username or email',
      });
      validated = false;
    }

    if (!password) {
      this.setState({
        ignorePristine: true,
        passwordError: 'Password cannot be blank',
      });
      validated = false;
    }
    return validated;
  }

  submitForm = (data) => {
    const self = this;
    const login = data.login || $('input[name="login"]').val();
    const password = data.password || $('input[name="password"]').val();

    if (!this.validateRequiredFields(data)) {
      return;
    }

    self.setState({
      loadingState: true,
    });

    this.props.client.mutate({
      mutation: gql`
        mutation loginUser($login: String!, $password: String!) {
          signInUser(input: {
            login: $login,
            password: $password
          }) {
            user {
              access_token
              client_id
              id
              username
              avatar_url(version: "thumb")
              cover_image_url
              interests {
                edges {
                  node {
                    name
                    id
                  }
                }
              }
              first_name
              description
              gender
              language
              birthday
              zip_code
            }
          }
        }
      `,
      variables: {
        login: login.toLowerCase(),
        password: password,
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
        const activeCacheObject = {
          myBubblz: false,
          myFeed: false,
          friendsFeed: false,
          intPeople: false,
          intBubblz: false,
          privChat: false,
          notifs: false,
        };
        localStorage.setItem('mbubblz_activeCache', JSON.stringify(activeCacheObject));
        localStorage.setItem('mbubblz_token', data.signInUser.user.access_token);
        localStorage.setItem('mbubblz_client_id', data.signInUser.user.client_id);
        localStorage.setItem('mbubblz_user', JSON.stringify(data.signInUser.user));

        ReactGA.event({
          category: 'User',
          action: 'Logged in',
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

  render() {
    const { data } = this.props;
    const loading = false;// data.loading;
    const {
      ignorePristine,
      loginError,
      passwordError,
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
              >
                <Paper style={CommonStyles.outside.paperStyle} zDepth={0} rounded={false} className='user-fields-paper'>
                  <FormText
                    name='login'
                    ref='username'
                    underlineShow={false}
                    inputStyle={CommonStyles.outside.inputStyle}
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    validations={{ matchRegexp: /[a-zA-Z0-9\_\+\-\@\.]/ }}
                    validationError='Invalid login'
                    floatingLabelText='Username or Email'
                    style={CommonStyles.outside.textStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    onChange={() => this.setState({ loginError: '' })}
                    ignorePristine={ignorePristine}
                    forcedError={loginError}
                  />
                  <FormText
                    name='password'
                    ref='password'
                    underlineShow={false}
                    inputStyle={CommonStyles.outside.inputStyle}
                    floatingLabelStyle={CommonStyles.outside.labelStyle}
                    floatingLabelFocusStyle={CommonStyles.outside.labelFocusStyle}
                    floatingLabelText='Password'
                    style={CommonStyles.outside.textStyle}
                    errorStyle={CommonStyles.outside.errorStyle}
                    type='password'
                    onChange={() => this.setState({ passwordError: '' })}
                    ignorePristine={ignorePristine}
                    forcedError={passwordError}
                  />
                  <Link to='/forgot_password' className='forgot-password-link'>Forgot password?</Link>
                  <FlatButton
                    backgroundColor={CommonStyles.outside.buttonBackgroundColor}
                    hoverColor={CommonStyles.outside.buttonHoverColor}
                    label={ this.state.loadingState ? <div className='loader-wrapper'><div className='loader' /></div> : 'Sign In'}
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

export default withApollo(SignInContainer);
